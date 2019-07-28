require('whatwg-fetch');

import cookie from 'react-cookie';

var exports = function () {
    var csrftoken = cookie.load('csrftoken');

    var patchMethod = function (url, data, method) {
        "use strict";
            if (method === undefined) {
                method = "PATCH"
            }
            return new Promise(function (resolved, rejected) {
                fetch(url, {
                    method: method,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify(data)
                }).then((response) => {
                    // TODO: should use more generic handling for the error values,
                    // see, e.g., fetch README.md.
                    if (response.status >= 200 && response.status < 300) {
                        console.log("Got response: ", response);
                        if (response.status !== 204) {
                            response.json().then((json) => {
                                resolved(json);
                            }).catch((err) => {
                                rejected(err)
                            });
                        } else {
                            resolved();
                        }
                    } else {
                        rejected({
                            status: response.status,
                            data: response.statusText
                        });
                    }
                }).catch((e) => { rejected(e)});
            });
    };

    return {
        getData: function (url) {
            "use strict";
            return new Promise(function (resolved, rejected) {
                fetch(url, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin'
                }).then((response) => {
                    response.json().then((json) => {
                        resolved(json);
                    }).catch((e) => rejected(e));
                }).catch((e) => {
                    rejected(e)
                });

            })
        },

        patch: patchMethod,

        post: function (url, data) {
            "use strict";
            return patchMethod(url, data, "POST");
        },

        put: function (url, data) {
            "use strict";
            return patchMethod(url, data, "PUT");
        },

        delete: function (url, data) {
            "use strict";
            return patchMethod(url, data, "DELETE");
        }
    }
}();

module.exports = exports;
