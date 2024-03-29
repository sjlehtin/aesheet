require('whatwg-fetch');

import Cookies from 'universal-cookie';

export function patch(url, data, method) {
    if (method === undefined) {
        method = "PATCH";
    }
    const cookies = new Cookies();

    return new Promise(function (resolved, rejected) {
        fetch(url, {
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRFToken': cookies.get('csrftoken')
            },
            credentials: 'same-origin',
            body: JSON.stringify(data)
        }).then((response) => {
            // TODO: should use more generic handling for the error values,
            // see, e.g., fetch README.md.
            if (response.status >= 200 && response.status < 300) {
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
        }).catch((e) => {
            rejected(e)
        });
    });
}

export async function getData(url) {
    const res = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        })
    return await res.json()
}

export function post(url, data) {
    return patch(url, data, "POST");
}

export function put(url, data) {
    return patch(url, data, "PUT");
}

export function del(url, data) {
    return patch(url, data, "DELETE");
}
