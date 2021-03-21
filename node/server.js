'use strict';

const express = require('express');
const crypto = require('crypto');
const mustacheExpress = require('mustache-express');


// Constants
const PORT = process.env.PORT;
const HOST = '0.0.0.0';

// App
const app = express();

app.use(express.json());

app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

app.get('/', (request, response) => {
    response.render('home');
    // TODO: In the future we should "Sign in with Slack" here.
});

app.get('/standups', (request, response) => {
    response.render('standups');
    // TODO: Show a list of standups, we should be able to edit each one.
});

app.post('/standups', (request, response) => {
    // TODO:
    //  - Set up cron jobs.
    //  - Save data in database.
    //  - Redirect to the edit page for the new standup.
    response.redirect('/standups');
    response.render('standups');
});

app.get('/standups/:standup_id', (request, response) => {
    // TODO:
    //  - Show information about this standup and allow editing.
    response.send(request.params);
});

app.patch('/standups/:standup_id', (request, response) => {
    // TODO:
    //  - Edit this standup.
    response.send(request.params);
});

app.delete('/standups/:standup_id', (request, response) => {
    // TODO:
    //  - Delete this standup.
    response.send(request.params);
});

app.post('/events', (request, response) => {
    if (!verify_slack(request)) {
        throw new Error("Slack authentication failed");
    }

    const type = request.body['type'];

    switch (type) {
        case "url_verification":
            response.send(request.body['challenge']);
            return;
        case "event_callback":
            handle_event(request.body['event']);
            break;
        default:
            console.log(`Unrecognised message type ${type}$`);
            break;
    }

    response.send("");
});

// TODO: Gets called by cron
app.get('/start_standup', (request, response) => {
    console.log("Starting standup");
    // TODO:
    //  - Get some kind of ID from the request.
    //  - Look up the configuration for the standup.
    //  - Send messages as appropriate.
    response.send("");
});

// TODO: Gets called by cron
app.get('/stop_standup', (request, response) => {
    console.log("Stopping standup");
    // TODO:
    //  - Get some kind of ID from the request.
    //  - Look up the configuration for the standup.
    //  - Send the results.
    response.send("");
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);

function verify_slack(request) {
    const timestamp = request.headers['x-slack-request-timestamp'];
    const basestring = `v0:${timestamp}:${JSON.stringify(request.body)}`;

    const secret = process.env.SLACK_SIGNING_SECRET;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(basestring);
    const expected_signature = `v0=${hmac.digest('hex')}`;

    const actual_signature = request.headers['x-slack-signature'];

    if (actual_signature !== expected_signature) {
        console.log(
            `Verification failed, got ${actual_signature} but expected ${expected_signature}. Base string was ${basestring}.`);
        return false;
    }
    return true;
}

function handle_event(event_data) {
    if (event_data["type"] != "message") {
        console.log(`Unrecognised event type ${type}`);
        return;
    }

    console.log(`Received ${event_data['text']} from ${event_data['user']}`);

    // TODO: Save this response in the database.
    // TODO: Ask the next question if necessary.
    //
    // TODO: What if a user is in multiple standups? Could just disallow that for now.
}


// TODO: OAuth (need this in order to actually distribute)
// https://api.slack.com/authentication/oauth-v2. But for now it can just be internal (see
// https://api.slack.com/start/overview#installing_distributing).
