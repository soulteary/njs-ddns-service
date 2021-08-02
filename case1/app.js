const zoneId = process.env.DNS_ZONE_ID;
const recordName = process.env.DNS_RECORD_NAME;


function getRecordIds(r, zoneId, domain) {
    return new Promise(function (resolve, reject) {
        r.subrequest(`/client/v4/zones/${zoneId}/dns_records?name=${domain}`, { method: 'GET' })
            .then(reply => {
                const response = JSON.parse(reply.responseBody);

                if (!response.success) {
                    return reject(false);
                }

                const filtered = response.result.filter(item => {
                    return item.name === domain
                });

                if (filtered.length) {
                    return resolve(filtered[0].id);
                } else {
                    return resolve(false);
                }
            })
            .catch(e => reject(e));
    });
}

function createRecordByName(r, zoneId, domain, clientIP) {
    return new Promise(function (resolve, reject) {
        const params = {
            type: "A",
            name: domain,
            content: clientIP,
            ttl: 120
        };
        r.subrequest(`/client/v4/zones/${zoneId}/dns_records`, {
            method: "POST",
            body: JSON.stringify(params)
        })
            .then(reply => JSON.parse(reply.responseBody))
            .then(response => {
                if (response.success) {
                    return reject(JSON.stringify(response, null, 4));
                }
                return resolve(true);
            })
            .catch(e => reject(e));
    });
}

function updateExistRecord(r, zoneId, domain, recordId, clientIP) {
    return new Promise(function (resolve, reject) {
        const params = {
            id: recordId,
            type: "A",
            name: domain,
            content: clientIP,
            ttl: 120
        };

        r.subrequest(`/client/v4/zones/${zoneId}/dns_records/${recordId}`, {
            method: 'PUT',
            body: JSON.stringify(params)
        })
            .then(reply => JSON.parse(reply.responseBody))
            .then(response => {
                if (response.success) {
                    return reject(JSON.stringify(response, null, 4));
                }
                return resolve(true);
            })
            .catch(e => reject(e));
    });
}

function whatsMyIP(r) {
    return new Promise(function (resolve, reject) {
        r.subrequest('/internal/whatsmyip?ie=utf-8')
            .then(reply => {
                const ip = reply.responseBody.match(/(\d+\.){3}\d+/);
                if (!ip) return resolve("127.0.0.1");
                return resolve(ip[0]);
            })
            .catch(e => reject(e));
    })
}

function main(r) {
    whatsMyIP(r).then(clientIP => {
        const domain = recordName;
        getRecordIds(r, zoneId, domain).then(recordId => {

            if (recordId) {
                updateExistRecord(r, zoneId, domain, recordId, clientIP).then(response => {
                    r.return(200, response);
                }).catch(e => r.return(500, e));

            } else {
                createRecordByName(r, zoneId, domain, clientIP).then(response => {
                    r.return(200, response);
                }).catch(e => r.return(500, e));
            }

        }).catch(e => r.return(500, e));
    }).catch(e => r.return(500, e));
}


export default { main }