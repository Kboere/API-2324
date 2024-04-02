import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

const app = express();

// Set up middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");


// Define routes
app.get("/", async function (req, res) {
  const url = `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.API_TOKEN}&language=en-US&page=1`;

  try {
      const response = await fetch(url);
      const data = await response.json();
      res.render('pages/index', { movies: data.results, title: 'Popular Movies' });
  } catch (error) {
      console.error('Fetching movies failed:', error);
      res.status(500).send('Failed to fetch movies');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
