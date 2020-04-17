const functions = require('firebase-functions');
const crypto = require('crypto');
const https = require('https');

function verify_slack(request) {
    timestamp = request.headers['x-slack-request-timestamp'];
    basestring = `v0:${timestamp}:${JSON.stringify(request.body)}`;
    console.log(basestring);

    secret = functions.config().slack.secret;
    hmac = crypto.createHmac('sha256', secret)
    hmac.update(basestring);
    expected_signature = `v0=${hmac.digest('hex')}`;

    actual_signature = request.headers['x-slack-signature'];

    if (actual_signature !== expected_signature) {
        console.log(
            `Verification failed, got ${actual_signature} but expected ${expected_signature}. Base string was ${basestring}.`);
        return false;
    }
    return true;
}

function handle_event(event_data) {
    console.log(`Received ${event_data['text']} from ${event_data['user']}`);
    // TODO: Save this response in the database.
    // TODO: Ask the next question if necessary.
}

function request_promise(options) {
    return new Promise( (resolve, reject) => {
        const request = https.request(options, response => {
            let body = [];
            response.on('data', (chunk) => {
                body.push(chunk);
            }).on('end', () => {
                body = Buffer.concat(body).toString();
                resolve(body);
            });
        });

        request.on('error', error => {
            reject(error);
        });

        request.end();
    });
}

exports.events = functions.https.onRequest((request, response) => {
    if (!verify_slack(request)) {
        throw new functions.https.HttpsError("unauthenticated", "Slack authentication failed");
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
            console.log(`Unrecognised event type ${type}$`);
            break;
    }

    response.send("");
});

// TODO: Where should this come from?

//exports.startsession = functions.https.onRequest((request, response) => {
//    // TODO: Start asking questions.
//    //
//});


exports.stopsession = functions.https.onRequest((request, response) => {
    // TODO: Post results to appropriate channel.
    // TODO: Delete session.
});

// TODO: API for configuring standups.
//
exports.listusers = functions.https.onRequest((request, response) => {
    // Temp endpoint, this would form part of the configuration flow.
    const options = {
        hostname: 'slack.com',
        path: `/api/users.list?token=${bearer}`,
        method: 'GET'
    }

    return request_promise(options)
        .then(body => {
            response.send(body);
            return;
        })
        .catch(error => {
            response.send("Error: " + error);
        });
});
