require('whatwg-fetch');

import cookie from 'react-cookie';

var exports = function () {
    var csrftoken = cookie.load('csrftoken');
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
                    });
                }).catch((e) => {
                    rejected(e)
                });

            })
        },

        patch: function (url, data) {
            "use strict";

            return new Promise(function (resolve, reject) {
                fetch(url, {
                    method: "PATCH",
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
                        resolve(response.json());
                    } else {
                        reject({
                            status: response.status,
                            data: response.statusText}
                        );
                    }
                });
            });
        }
    }
}();

module.exports = exports;
