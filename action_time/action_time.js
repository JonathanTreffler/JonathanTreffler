import { Octokit } from "@octokit/core";
import humanizeDuration from "humanize-duration";
import pLimit from 'p-limit';
import dotenv from "dotenv";
import fs from 'fs';
import { updateSection } from "../file-section-updater/file_updater.js";
dotenv.config();

const octokit = new Octokit({ auth: process.env.BOT_GITHUB_TOKEN });

async function getRepoActionCount(user, repository) {
    const {headers, data: countData} = await octokit.request('GET /repos/{owner}/{repo}/actions/runs', {
        owner: user,
        repo: repository,
        per_page: 1
    })

    console.log(headers["x-ratelimit-used"], " / ", headers["x-ratelimit-limit"]);

    let requestsLeft = headers["x-ratelimit-remaining"];

    return { total_count: countData.total_count, requestsLeft};
}

async function getRepoTime(user, repository, total_count) {

    let pageRequests = [];

    const limit = pLimit(2);

    for(let i = 1; i < (total_count / 100) + 1; i++) {
        console.log("Request #" + i, "sheduled");
        pageRequests.push(
            limit(function () {
                console.log("Request #" + i, "started");
                return octokit.request('GET /repos/{owner}/{repo}/actions/runs', {
                    owner: user,
                    repo: repository,
                    per_page: 100,
                    page: i
                })
            })
        );
    }

    let summedRunTime = 0;

    let pages = await Promise.all(pageRequests);

    console.log("all requests done");

    for(let page of pages) {
        let workflow_runs = page.data.workflow_runs;

        for (run of workflow_runs.filter((r) => (r.run_started_at && r.updated_at))) {
            let runTime = (new Date(run.updated_at) - new Date(run.run_started_at)) / 1000;
            summedRunTime += runTime;
        }
    }

    console.log(Math.floor(summedRunTime / 60 / 60) + " hours");
    console.log("Writing to file ...");
    fs.writeFileSync("./stats/"+user+"_"+repository+".txt", summedRunTime+"");
    console.log("... done");
}

async function run() {
    var requestsLeft = 0;
    let repositories = JSON.parse(fs.readFileSync("repositories.json"));

    while(true) {
        let currentId = parseInt(fs.readFileSync("currentId.txt"));

        if(currentId >= repositories.length) {
            currentId = 0;
            fs.writeFileSync("currentId.txt", "0");
            break;
        }

        let user = repositories[currentId][0];
        let repository = repositories[currentId][1];

        console.log("===== " + user + "/" + repository + " =====");

        let total_count;
        
        ({ total_count, requestsLeft } = await getRepoActionCount(user, repository));

        let requestsNeeded = Math.ceil(total_count/100);

        console.log("requestsLeft:", requestsLeft);
        console.log("requestsNeeded:", requestsNeeded);

        if(requestsLeft > requestsNeeded) {
            console.log("Enough Requests left")
            await getRepoTime(user, repository, total_count);
            fs.writeFileSync("currentId.txt", currentId + 1 + "");
        } else {
            console.log("Not enough Requests left")
            break;
        }
    }
}

async function sumUpRepositories() {
    let repositories = JSON.parse(fs.readFileSync("repositories.json"));

    let sum = 0;

    for(let item of repositories) {
        let user = item[0];
        let repository = item[1];

        sum += parseInt(fs.readFileSync("./stats/"+user+"_"+repository+".txt"));
    }

    console.log("Sum all repositories:", sum);
    return sum;
}

run().then(function() {
    sumUpRepositories().then(function(sum) {
        let startString = "<!-- /start_action_time/ -->";
        let endString = "<!-- /end_action_time/ -->";

        let duration = humanizeDuration(sum * 1000);

        console.log(duration);

        let suffix = " of Github Actions Runtime used in total. \n\nI really hope public actions stay free 😂 \n";

        updateSection("../README.md", startString, endString, duration + suffix);
    });
});
