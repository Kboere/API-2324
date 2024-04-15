document.addEventListener('DOMContentLoaded', function () {
  const movies = document.querySelectorAll('.movie');
  const modal = document.getElementById('myModal');
  const modalTitle = document.getElementById('modal-title');
  const modalOverview = document.getElementById('modal-overview');
  const closeModal = document.querySelector('.close');

  movies.forEach(movie => {
    movie.addEventListener('click', async function () {
      const movieId = this.getAttribute('data-movie-id');

      try {
        // Send a request to the server to fetch movie details
        const response = await fetch(`/details?movieId=${movieId}`);
        const movieDetails = await response.json();

        // Populate the modal with the received movie details
        modalTitle.textContent = movieDetails.title;
        modalOverview.textContent = movieDetails.overview;

        // Display the modal
        modal.style.display = 'block';
      } catch (error) {
        console.error('Error fetching movie details:', error);
      }
    });
  });

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
});
