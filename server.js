import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import { MongoClient, ServerApiVersion } from 'mongodb';

dotenv.config();

// Connecting mongoDB
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
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

// Set up middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
// Configure sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false},
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
  return data.results;
}

// Define the function to fetch movie details from TMDb
async function fetchMovieDetails (movieId, apiToken) {
  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiToken}&include_adult=false&include_video=false&language=en-US&page=1&primary_release_year=2010&sort_by=popularity.desc`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// Define routes
// login page route
app.get('/login', (req, res) => {
  // Pass null as error by default
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

    const userName = req.session.username;
    const userLoggedIn = await users.findOne({ username: userName });

    res.render('pages/index', { movies, user: userLoggedIn });
  } catch (error) {
    console.error('Fetching movies failed:', error);
    res.status(500).send('Failed to fetch movies');
  }
});

// Define a route to handle the form submission
app.post('/save-post', async (req, res) => {
  try {
    const movies = await fetchMovies(process.env.API_TOKEN);
    const { movieId, userId, title, releaseDate, overview, voteAverage, voteCount, popularity, poster } = req.body;

    // Create an object containing the post data
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
    };

    // Insert the post data into the "posts" collection in MongoDB
    await posts.insertOne(postData);

    console.log('Post saved:', postData);

    // Send a success response
    res.render('pages/index', { movies, message: 'Post saved successfully', userId: req.session.userId });
  } catch (error) {
    // Log the error
    console.error('Error saving post:', error);
    // Send an error response
    res.status(500).send('Failed to save post');
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

    // Call the fetchMovieDetails function to fetch movie details
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
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiToken}&query=${encodeURIComponent(search)}&include_adult=false&include_video=false&language=en-US&page=1&primary_release_year=2010&sort_by=popularity.desc`;
      const response = await fetch(url);
      const data = await response.json();
      movies = data.results;
      console.log(`Search query: ${search}`);

      console.log(movies);
    } else {
      // If no search query, show default movies
      console.log('No search query, fetching default movies');
      movies = await fetchMovies(apiToken);
    }

    res.render('pages/search', { movies, searchQuery: search, user: userLoggedIn});
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
