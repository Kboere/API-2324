// // urlB64ToUint8Array is a magic function that will encode the base64 public key
// // to Array buffer which is needed by the subscription option
// const urlB64ToUint8Array = base64String => {
//   const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
//   const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
//   const rawData = atob(base64)
//   const outputArray = new Uint8Array(rawData.length)
//   for (let i = 0; i < rawData.length; ++i) {
//     outputArray[i] = rawData.charCodeAt(i)
//   }
//   return outputArray
// }
// // saveSubscription saves the subscription to the backend
// const saveSubscription = async subscription => {
//   // const SERVER_URL = 'http://localhost:2222/save-subscription'
//   const response = await fetch('/save-subscription', {
//     method: 'post',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(subscription),
//   })

//   if (!response.ok) {
//     throw new Error(`Server responded with status: ${response.status}`);
//   }

//   return response.json()
// }
// self.addEventListener('activate', async () => {
//   // This will be called only once when the service worker is activated.
//   try {
//     const applicationServerKey = urlB64ToUint8Array(
//       'BGO5gXdDxvClhx_KN0og44gJdgeTJUtj3i6j6Cc0tPaSd4fx4JQo84hrB3NPaIBAbHjVKJh-kk1_vzTdf8gC7s0'
//     )
//     const options = { applicationServerKey, userVisibleOnly: true }
//     const subscription = await self.registration.pushManager.subscribe(options)
//     const response = await saveSubscription(subscription)
//     console.log(response)
//   } catch (err) {
//     console.log('Error', err)
//   }
// })
