document.addEventListener('DOMContentLoaded', () => {
    const applicationServerKey =
      'BJTwdiTu17tovcSue4H5Y2MjHWZcapD_NctQeqrD_ma9Q_sfTKyWbPk0Dg8RvqgbYT_YaQR4znosCaic1yUSzbA';
    let isPushEnabled = false;
  
    const pushButton = document.getElementById('register');
    if (!pushButton) {
      return;
    }
  
    pushButton.addEventListener('click', function() {
      if (isPushEnabled) {
        push_unsubscribe();
      } else {
        push_subscribe();
      }
    });
  
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported by this browser');
      changePushButtonState('incompatible');
      return;
    }
  
    if (!('PushManager' in window)) {
      console.warn('Push notifications are not supported by this browser');
      changePushButtonState('incompatible');
      return;
    }
  
    if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
      console.warn('Notifications are not supported by this browser');
      changePushButtonState('incompatible');
      return;
    }
  
    if (Notification.permission === 'denied') {
      console.warn('Notifications are denied by the user');
      changePushButtonState('incompatible');
      return;
    }
  
    navigator.serviceWorker.register('serviceWorker.js').then(
      () => {
        console.log('[SW] Service worker has been registered');
        push_updateSubscription();
      },
      e => {
        console.error('[SW] Service worker registration failed', e);
        changePushButtonState('incompatible');
      }
    );
  
    function changePushButtonState(state) {
      switch (state) {
        case 'enabled':
          pushButton.disabled = false;
          pushButton.textContent = 'NOTIFICATIONS ENABLED';
          isPushEnabled = true;
          continueRedirect();
          break;
        case 'disabled':
          pushButton.disabled = false;
          pushButton.textContent = 'ALLOW NOTIFICATIONS';
          isPushEnabled = false;
          break;
        case 'computing':
          pushButton.disabled = true;
          pushButton.textContent = 'LOADING...';
          break;
        case 'incompatible':
          pushButton.disabled = true;
          pushButton.textContent = 'NOTIFICATIONS NOT SUPPORTED';
          break;
        default:
          console.error('Unhandled push button state', state);
          break;
      }
    }
  
    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
  
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }
  
    function checkNotificationPermission() {
      return new Promise((resolve, reject) => {
        if (Notification.permission === 'denied') {
          return reject(new Error('Push messages are blocked.'));
        }
  
        if (Notification.permission === 'granted') {
          return resolve();
        }
  
        if (Notification.permission === 'default') {
          return Notification.requestPermission().then(result => {
            if (result !== 'granted') {
              reject(new Error('Bad permission result'));
            } else {
              resolve();
            }
          });
        }

        return reject(new Error('Unknown permission'));
      });
    }
  
    function push_subscribe() {
      changePushButtonState('computing');
  
      return checkNotificationPermission()
        .then(() => navigator.serviceWorker.ready)
        .then(serviceWorkerRegistration =>
          serviceWorkerRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(applicationServerKey),
          })
        )
        .then(subscription => {
          return push_sendSubscriptionToServer(subscription, 'POST');
        })
        .then(subscription => subscription && changePushButtonState('enabled'))
        .catch(e => {
          if (Notification.permission === 'denied') {
            console.warn('Notifications are denied by the user.');
            changePushButtonState('incompatible');
          } else {
            console.error('Impossible to subscribe to push notifications', e);
            changePushButtonState('disabled');
          }
        });
    }
  
    function push_updateSubscription() {
      navigator.serviceWorker.ready
        .then(serviceWorkerRegistration => serviceWorkerRegistration.pushManager.getSubscription())
        .then(subscription => {
          changePushButtonState('disabled');
          if (!subscription) {
            return;
          }
            return push_sendSubscriptionToServer(subscription, 'PUT');
        })
        .then(subscription => subscription && changePushButtonState('enabled'))
        .catch(e => {
          console.error('Error when updating the subscription', e);
        });
    }
  
    function push_unsubscribe() {
      changePushButtonState('computing');
        navigator.serviceWorker.ready
        .then(serviceWorkerRegistration => serviceWorkerRegistration.pushManager.getSubscription())
        .then(subscription => {
          if (!subscription) {
            changePushButtonState('disabled');
            return;
          }
          return push_sendSubscriptionToServer(subscription, 'DELETE');
        })
        .then(subscription => subscription.unsubscribe())
        .then(() => changePushButtonState('disabled'))
        .catch(e => {
          console.error('Error when unsubscribing the user', e);
          changePushButtonState('disabled');
        });
    }
  
    function push_sendSubscriptionToServer(subscription, method) {
      const key = subscription.getKey('p256dh');
      const token = subscription.getKey('auth');
      const contentEncoding = (PushManager.supportedContentEncodings || ['aesgcm'])[0];

      const jsonSubscription = subscription.toJSON();
      return fetch('https://uscg-web-fun-facts-w7vmh474ha-uc.a.run.app/api/register', {
        method: 'POST',
        body: JSON.stringify(Object.assign(jsonSubscription, { contentEncoding })),
      });
    }

    function continueRedirect() {
      console.log("next");
      if (next = document.getElementById("next")) next.click();
    }
  });