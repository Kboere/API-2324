document.addEventListener('DOMContentLoaded', function () {
  const movies = document.querySelectorAll('.movie');
  const modal = document.getElementById('myModal');
  const modalPoster = document.getElementById('modal-poster');
  const modalPosterMini = document.getElementById('modal-poster-mini');
  const modalUser = document.getElementById('modal-user');
  const modaldate = document.getElementById('modal-date');
  const modalTitle = document.getElementById('modal-title');
  const modalOverview = document.getElementById('modal-overview');
  const voteAverage = document.getElementById('vote-average');
  const voteCount = document.getElementById('vote-count');
  const popularity = document.getElementById('popularity-modal');
  const closeModal = document.querySelector('.close');

  const dateEmoji = '\u{1F4C5}';
  const centerDot = '\u{00B7}';

  movies.forEach((movie) => {
    movie.addEventListener('click', async function () {
      const movieId = this.getAttribute('data-movie-id');

      try {
        // Send a request to the server to fetch movie details
        const response = await fetch(`/details?movieId=${movieId}`);
        const movieDetails = await response.json();

        // Update the modal with the movie details
        modalPoster.src = `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`;
        modalPoster.alt = movieDetails.title;
        modalPosterMini.src = `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`;
        modalPosterMini.alt = movieDetails.title;
        modalUser.textContent = movieDetails.title;
        modaldate.textContent = `${dateEmoji} ${movieDetails.release_date}`; // Unicode for calendar emoji
        modalTitle.textContent = `${movieDetails.title} ${centerDot}`;
        modalOverview.textContent = movieDetails.overview;
        voteAverage.textContent = formatVoteAverage(movieDetails.vote_average);
        voteCount.textContent = `/10 ${formatVoteCount(movieDetails.vote_count)} votes`;
        popularity.textContent = movieDetails.popularity;

        // Display the modal
        modal.style.display = 'block';
      } catch (error) {
        console.error('Error fetching movie details:', error);
      }
    });
  });

  function formatVoteCount (voteCount) {
    if (voteCount >= 1000) {
      return (voteCount / 1000).toFixed(0) + 'k';
    }
    return voteCount;
  }

  function formatVoteAverage (voteAverage) {
    return parseFloat(voteAverage).toFixed(1);
  }

  // Close the modal when the close button is clicked
  closeModal.addEventListener('click', function () {
    modal.style.display = 'none';
  });

  // Close the modal when the overlay outside the modal is clicked
  window.addEventListener('click', function (event) {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  });

  // Close the modal when the escape key is pressed
  window.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      modal.style.display = 'none';
    }
  });
});

// Function to handle button click
// function handleClick(button) {
//   // Get the value of the attribute for this button
//   const attributeValue = button.getAttribute('data-movieid');

//   // Check if attributeValue exists
//   if (attributeValue) {
//     // Check if the attribute is already stored
//     const stored = localStorage.getItem(attributeValue);
//     if (stored) {
//       // If already stored, remove it and change button color
//       localStorage.removeItem(attributeValue);
//       console.log('Attribute removed from local storage:', attributeValue);
//       button.classList.remove('stored-color');
//       button.classList.add('default-color');
//     } else {
//       // If not stored, store it and change button color
//       localStorage.setItem(attributeValue, 'true');
//       console.log('Attribute saved to local storage:', attributeValue);
//       button.classList.remove('default-color');
//       button.classList.add('stored-color');
//     }
//   } else {
//     console.error('Attribute not found');
//   }
// }

// // Get all buttons with the class 'myButton'
// const bookmarkedBtn = document.querySelectorAll('.bookmark-btn');
// console.log('bookmarkedBtn:', bookmarkedBtn);

// // Loop through each button and add click event listener
// bookmarkedBtn.forEach(button => {
//   button.addEventListener('click', () => handleClick(button));

//   // Check if the attribute is stored in local storage for this button
//   const stored = localStorage.getItem(button.getAttribute('data-movieid'));
//   if (stored) {
//     // Change button color if attribute is stored
//     button.classList.remove('default-color');
//     button.classList.add('stored-color');
//   }
// });


// const check = () => {
//   if (!('serviceWorker' in navigator)) {
//     throw new Error('No Service Worker support!')
//   }
//   if (!('PushManager' in window)) {
//     throw new Error('No Push API Support!')
//   }
// }

// // I added a function that can be used to register a service worker.
// const registerServiceWorker = async () => {
//   console.log('Registering service worker...')
//   const swRegistration = await navigator.serviceWorker.register('/js/service-worker.js'); //notice the file name
//   return swRegistration;
// }

// const requestNotificationPermission = async () => {
//   const permission = await window.Notification.requestPermission();
//   // value of permission can be 'granted', 'default', 'denied'
//   // granted: user has accepted the request
//   // default: user has dismissed the notification permission popup by clicking on x
//   // denied: user has denied the request.
//   if(permission !== 'granted'){
//       throw new Error('Permission not granted for Notification');
//   }
//   console.log("permission for push notification:", Notification.permission)
// }

// const showLocalNotification = (title, body, swRegistration) => {
//   const options = {
//       body,
//       // here you can add more properties like icon, image, vibrate, etc.
//   };
//   swRegistration.showNotification(title, options);
// }

// const main = async () => {
//   check();
//   const swRegistration = await registerServiceWorker();
//   const permission =  await requestNotificationPermission();
//   showLocalNotification('This is title', 'this is the message', swRegistration);
// }
// main();
