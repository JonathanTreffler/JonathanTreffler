const { Octokit } = require("@octokit/core");
fs = require('fs');

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
    let summedRunTime = 0;

    for(let i = 1; i < (total_count / 100) + 1; i++) {
        console.log("Request #" + i);
        const {headers, data} = await octokit.request('GET /repos/{owner}/{repo}/actions/runs', {
            owner: user,
            repo: repository,
            per_page: 100,
            page: i
        })

        let workflow_runs = data.workflow_runs;
    
        for(run of workflow_runs) {
            let runTime = (new Date(run.updated_at) - new Date(run.run_started_at)) / 1000;

            //console.log(runTime, " s")

            summedRunTime += runTime;
        }

        console.log("sum so far:", summedRunTime);
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

    for(repository of repositories) {
        let user = repository[0];
        let repository = repository[1];

        sum += parseInt(fs.readFileSync("./stats/"+user+"_"+repository+".txt"));
    }

    console.log("Sum all repositories:", sum);
}

run();
sumUpRepositories();