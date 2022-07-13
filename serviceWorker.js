self.addEventListener('push', function (event) {
    if (event.data) {
        const payload = event.data.text();
        console.log(payload);
    }
});