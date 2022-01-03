const { Octokit } = require("@octokit/core");

const octokit = new Octokit({ auth: "" });

async function getRepoTime(user, repository) {
    let summedRunTime = 0;

    const {headers, data: countData} = await octokit.request('GET /repos/{owner}/{repo}/actions/runs', {
        owner: user,
        repo: repository,
        per_page: 100
    })

    console.log(headers["x-ratelimit-used"], " / ", headers["x-ratelimit-limit"]);

    let total_count = countData.total_count;

    console.log("total count: ", total_count);
    console.log("requests needed: ", Math.ceil(total_count/100));

    for(let i = 1; i <= total_count/100; i++) {
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

    console.log("===== " + user + "/" + repository + " =====");
    console.log(Math.floor(summedRunTime / 60 / 60) + " hours");
}

getRepoTime("fractava", "status");