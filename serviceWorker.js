self.addEventListener('push', function (event) {
    if (event.data) {
        const payload = JSON.parse(event.data.text());
        console.log(payload);
    }
});