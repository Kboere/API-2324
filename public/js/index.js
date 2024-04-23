document.addEventListener('DOMContentLoaded', function () {
  const movies = document.querySelectorAll('.movie-grid');
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
  const movieInfo = document.querySelector('.bookmarked-content');

  const dateEmoji = '\u{1F4C5}';
  const centerDot = '\u{00B7}';

  movies.forEach((movie) => {
    movie.addEventListener('click', async function () {
      const movieId = this.getAttribute('data-movie-id');
      movieInfo.classList.add('bookmarked-content-active');

      console.log('movie is clicked');

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
        modaldate.textContent = `${dateEmoji} ${formatDate(movieDetails.release_date)}`; // Unicode for calendar emoji
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

  function formatVoteCount(voteCount) {
    if (voteCount >= 1000) {
      return (voteCount / 1000).toFixed(0) + 'k';
    }
    return voteCount;
  }

  function formatDate(date) {
    // set the data as  day- month- year
    return date.split('-').reverse().join('-');
  }

  function formatVoteAverage(voteAverage) {
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

const sharePoster = document.querySelectorAll('.movie-info-head h2');
const imgPoster = document.querySelectorAll('.movie-poster img');

// Check if Web Share API is supported
if (navigator.share) {

  const sharing = document.querySelectorAll('.bxs-share');

  sharing.forEach((share, index) => {
    share.addEventListener('click', async () => {
      try {
        const title = sharePoster[index].textContent;
        const url = imgPoster[index].src;

        await navigator.share({
          title: title,
          text: 'Check out this movie!',
          url: url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    });
  });
} else {
  const sharing = document.querySelectorAll('.bxs-share');
  // Fallback for browsers that don't support Web Share API

  sharing.forEach((share, index) => {
    share.addEventListener('click', async () => {
      // Display a message to the user alert
      alert('Web Share API is not supported in your browser');
    });
  });

}



