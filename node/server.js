'use strict';

const express = require('express');
const crypto = require('crypto');


// Constants
const PORT = process.env.PORT;
const HOST = '0.0.0.0';

// App
const app = express();

app.use(express.json());

app.get('/', (request, response) => {
  response.send('Welcome to Standup Arthur');
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
}

