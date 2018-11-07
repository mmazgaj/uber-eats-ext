window.appConsole = console;

const STATUS_COOKIE_KEY = "RestaurantStatuses";

let ready = (fn) => {
    document.addEventListener('DOMContentLoaded', () => setTimeout(fn, 1000));
};

ready(function (event) {
    addNotifyCheckboxLayer();

    setInterval(() => {
        checkMarketplace()
    }, 10000);
});

let addNotifyCheckboxLayer = () => {
    let aNodes = [];
    let restaurantNodes = [];
    let restaurantsStatuses = JSON.parse(localStorage.getItem(STATUS_COOKIE_KEY)) || [];

    $("#app-content").on("DOMSubtreeModified", () => {
        const newANodes = $("a").toArray();
        if (aNodes.length === newANodes.length) {
            return;
        }

        aNodes = newANodes;
        restaurantNodes = aNodes.filter(node => {
            return /.*food-delivery.*/.test(node.href);
        });

        if (!restaurantNodes || !restaurantNodes.length) {
            return;
        }

        restaurantNodes.forEach(node => {
            node.parentElement.style.position = 'relative'
            const name = $(node).children().first().children(":nth-child(2)").text()
            let checkbox = $(node).find(`input[name='${name}']`);

            if (!checkbox.length) {
                const span = document.createElement("span");

                const label = document.createElement("label");
                label.className = "pure-material-checkbox";

                checkbox = document.createElement("input");
                checkbox.setAttribute('type', 'checkbox');
                checkbox.setAttribute('name', name);
                checkbox.checked = !!restaurantsStatuses.find(rStatus => rStatus.name === name);

                label.appendChild(checkbox);
                label.appendChild(span);
                node.appendChild(label);

                $(label).on('click', function (event) {
                    event.stopPropagation();

                    (this.firstChild.checked) ?
                        restaurantsStatuses.push({name: name, status: ""}) :
                        restaurantsStatuses = restaurantsStatuses.filter(rStatus => rStatus.name !== name);

                    localStorage.setItem(STATUS_COOKIE_KEY, JSON.stringify(restaurantsStatuses));
                });
            }
        });
    });
};

let sendNotification = (status, name) => {
    new Notification('UBER EATS - ' + name, {
        body: status,
        requireInteraction: true
    });
};

let checkMarketplace = () => {
    const xhr = new XMLHttpRequest();
    const csrfToken = window.csrfToken;
    const address = window.INITIAL_STATE.cartLocation.location.data;

    const postParams = {
        "targetLocation": address,
        "pageInfo": {"offset": 0, "pageSize": 1000}
    };

    xhr.open("POST", '/rtapi/eats/v1/allstores', true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("x-csrf-token", csrfToken);
    xhr.setRequestHeader("x-requested-with", 'XMLHttpRequest');

    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            const feed = JSON.parse(this.responseText);
            const restaurantsStatuses = JSON.parse(localStorage.getItem(STATUS_COOKIE_KEY)) || [];

            const restaurants = feed.feed.feedItems.filter(item => {
                if (item.type !== "STORE") {
                    return false;
                }

                return !!restaurantsStatuses.find(rstatus => rstatus.name === item.payload.storePayload.stateMapDisplayInfo.available.title.text);
            });

            restaurants.forEach(restaurant => {
                const status = restaurant.payload.storePayload.stateMapDisplayInfo.available.subtitle.text;
                const name = restaurant.payload.storePayload.stateMapDisplayInfo.available.title.text;

                let cookie = restaurantsStatuses.find(rStatus => rStatus.name === name);

                if (cookie.status !== status) {
                    sendNotification(status, name);
                    cookie.status = status;
                    localStorage.setItem(STATUS_COOKIE_KEY, JSON.stringify(restaurantsStatuses))
                }
            });
        }
    };
    xhr.send(JSON.stringify(postParams));
}
