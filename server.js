import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';

import { MongoClient, ServerApiVersion } from 'mongodb';
import { ObjectId } from 'mongodb';

dotenv.config();

// Connecting mongoDB
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
});
const dbName = 'api';

client
  .connect()
  .then(() => {
    console.log('Connected to MongoDB\'s API database!');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

const db = client.db(dbName);
const users = db.collection('users');
const posts = db.collection('posts');

const app = express();
let userIdObject;

// Set up middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
// Configure sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.set('view engine', 'ejs');

// Middleware function to check if user is authenticated
const requireLogin = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/login');
};

// Apply authentication middleware to all routes except for login
app.use((req, res, next) => {
  if (req.path === '/login') {
    return next(); // Exclude login route from authentication requirement
  }
  requireLogin(req, res, next);
});

app.use((req, res, next) => {
  res.locals.userId = req.session.userId;
  next();
});

// Define fetch function
async function fetchMovies (apiToken) {
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiToken}&include_adult=false&include_video=false&language=en-US&page=1&primary_release_year=2010&sort_by=popularity.desc`;
  const response = await fetch(url);
  const data = await response.json();

  // Loop through each movie and round the vote_average attribute to one decimal place
  data.results.forEach(movie => {
    movie.vote_average = Math.round(movie.vote_average * 10) / 10; // Round to one decimal place
    // Format vote_count to display in thousands
    movie.vote_count = formatVoteCount(movie.vote_count);

    // set the data as  day- month- year
    movie.release_date = movie.release_date.split('-').reverse().join('-');
  });

  return data.results;
}

// Define the function to fetch movie details from TMDb
async function fetchMovieDetails (movieId, apiToken) {
  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiToken}&include_adult=false&include_video=false&language=en-US&page=1&primary_release_year=2010&sort_by=popularity.desc`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

function formatVoteCount (voteCount) {
  if (voteCount >= 1000) {
    return (voteCount / 1000).toFixed(0) + 'k';
  }
  return voteCount;
}

// Define routes
// login page route
app.get('/login', (req, res) => {
  res.render('pages/login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  users
    .findOne({ username, password })
    .then((user) => {
      if (user) {
        req.session.userId = user._id; // Set user session
        req.session.username = user.username; // Set username session
        console.log('User logged in:', user);

        res.redirect('/');
      } else {
        res.render('pages/login', { error: 'Invalid username or password' });
      }
    })
    .catch((err) => {
      console.error('Error finding user:', err);
      res.status(500).send('Internal Server Error');
    });
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.redirect('/login');
    }
  });
});

// home page route
app.get('/', async function (req, res) {
  try {
    const movies = await fetchMovies(process.env.API_TOKEN);
    const userId = req.session.userId;
    userIdObject = new ObjectId(userId);

    const userLoggedIn = await users.findOne({ _id: userIdObject });

    res.render('pages/index', { movies, user: userLoggedIn, message: '' });
  } catch (error) {
    console.error('Fetching movies failed:', error);
    res.status(500).send('Failed to fetch movies');
  }
});

// handle bookmarking
app.post('/', async (req, res) => {
  try {
    const movies = await fetchMovies(process.env.API_TOKEN);
    const { movieId, title, releaseDate, overview, voteAverage, voteCount, popularity, poster } = req.body;
    const userId = req.session.userId;

    userIdObject = new ObjectId(userId);

    const userLoggedIn = await users.findOne({ _id: userIdObject });

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Check if the post already exists for the current user
    const existingPost = await posts.findOne({ movieId, userId });

    if (existingPost) {
      // If the post exists, delete it (unbookmark the movie)
      await posts.deleteMany({ movieId, userId });

      // Now use userIdObject in your update query
      if (userIdObject) {
        await users.updateOne(
          { _id: userIdObject },
          { $pull: { bookmarkedMovies: parseInt(movieId) } }
        );
      } else {
        console.error('userId is not a valid ObjectId:', userId);
      }

      res.render('pages/index', { movies, message: 'verwijderd', userId: userId, user: userLoggedIn });
    } else {
      // If the post doesn't exist, save it (bookmark the movie)
      const postData = {
        movieId: movieId,
        userId: userId,
        title: title,
        releaseDate: releaseDate,
        overview: overview,
        voteAverage: voteAverage,
        voteCount: voteCount,
        popularity: popularity,
        poster: poster,
        bookmarked: true,
      };

      await posts.insertOne(postData);

      // Update user document to include the bookmarked movie
      await users.updateOne(
        { _id: userIdObject },
        {
          $addToSet: { bookmarkedMovies: parseInt(movieId) }, // Add movieId to the bookmarkedMovies array
        },
        { upsert: true } // Creates the field if it doesn't exist
      );

      res.render('pages/index', { movies, message: 'toegevoegd', userId: userId, user: userLoggedIn });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});


// account page route
app.get('/account', async function (req, res) {
  try {
    const userName = req.session.username;
    const userLoggedIn = await users.findOne({ username: userName });

    const bookmarkedMovies = await posts.find({ userId: userLoggedIn._id.toString() }).toArray();

    res.render('pages/account', { user: userLoggedIn, bookmarkedMovies });
  } catch (error) {
    console.error('Fetching movies failed:', error);
    res.status(500).send('Failed to fetch movies');
  }
});

// details popup
app.get('/details', async (req, res) => {
  try {
    const movieId = req.query.movieId;
    const movieDetails = await fetchMovieDetails(movieId, process.env.API_TOKEN);

    // Send the movie details back to the client
    res.json(movieDetails);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

// Search page route
app.get('/search', async (req, res) => {
  let movies = [];
  let { search } = req.query;

  const userName = req.session.username;
  const userLoggedIn = await users.findOne({ username: userName });

  try {
    const apiToken = process.env.API_TOKEN;
    if (search) {
      // If there is a search query, fetch movies based on the query
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiToken}&query=${encodeURIComponent(search)}&include_adult=false&include_video=false&language=en-US&page=1&primary_release_year=2010&sort_by=popularity.desc`;
      const response = await fetch(url);
      const data = await response.json();
      movies = data.results;
    } else {
      // If no search query, show default movies
      console.log('No search query, fetching default movies');
      movies = await fetchMovies(apiToken);
    }

    res.render('pages/search', { movies, searchQuery: search, user: userLoggedIn });
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
