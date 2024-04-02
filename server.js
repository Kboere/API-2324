import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

const app = express();

// Set up middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Define fetch function
async function fetchMovies(apiToken) {
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiToken}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&primary_release_date.gte=2010-01-01`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results;
}

// Define routes
app.get("/", async function (req, res) {
  try {
    const movies = await fetchMovies(process.env.API_TOKEN);
    res.render('pages/index', { movies });
  } catch (error) {
    console.error('Fetching movies failed:', error);
    res.status(500).send('Failed to fetch movies');
  }
});

// Search route
app.get('/search', async (req, res) => {
  let movies = [];
  let title = 'Search Movies';
  let { search } = req.query;

  try {
    const apiToken = process.env.API_TOKEN;
    if (search) {
      // Corrected URL to use the search endpoint instead of the discover endpoint
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiToken}&language=en-US&query=${encodeURIComponent(search)}&page=1&include_adult=false&sort_by=popularity.desc&primary_release_date.gte=2010-01-01`;
      const response = await fetch(url);
      const data = await response.json();
      movies = data.results;
      title = `Search Results for "${search}"`;
      console.log(`Search query: ${search}`);
    } else {
      // If no search query, show default movies
      console.log('No search query, fetching default movies');
      movies = await fetchMovies(apiToken);
    }

    // Render the search page with either search results or default movies
    res.render('pages/search', { movies, title, searchQuery: search });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
