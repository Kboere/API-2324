import dotenv from "dotenv";
import multer from "multer";
import express from "express";
import session from "express-session";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();

// Connecting mongoDB
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
const dbName = "api";

client
  .connect()
  .then(() => {
    console.log("Connected to MongoDB's API database!");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

const db = client.db(dbName);
const users = db.collection("users");
const posts = db.collection("posts");

const app = express();

// Set up middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
// Configure sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret", // Replace with a more secure secret in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);
app.set("view engine", "ejs");

// Configure Multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads"); // Destination folder for storing uploaded images
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// Middleware function to check if user is authenticated
const requireLogin = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next(); // User is authenticated, allow the request to proceed
  }
  res.redirect("/login");
};

// Apply authentication middleware to all routes except for login
app.use((req, res, next) => {
  if (req.path === "/login") {
    return next(); // Exclude login route from authentication requirement
  }
  requireLogin(req, res, next);
});

app.use((req, res, next) => {
  res.locals.userId = req.session.userId;
  next();
});

// Define fetch function
async function fetchMovies(apiToken) {
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiToken}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&primary_release_date.gte=2010-01-01`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results;
}

// Define the function to fetch movie details from TMDb
async function fetchMovieDetails(movieId, apiToken) {
  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiToken}&language=en-US`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// Define routes
// login page route
app.get("/login", (req, res) => {
  // Pass null as error by default
  res.render("pages/login", { error: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  console.log("Login attempt:", { username, password }); // Log the form data

  users
    .findOne({ username, password })
    .then((user) => {
      if (user) {
        // Successful login
        req.session.userId = user._id; // Set user session
        req.session.username = user.username; // Set username session
        console.log("User logged in:", user);
        res.redirect("/");
      } else {
        // Failed login
        res.render("pages/login", { error: "Invalid username or password" });
      }
    })
    .catch((err) => {
      console.error("Error finding user:", err);
      res.status(500).send("Internal Server Error");
    });
});

// Logout route
app.post("/logout", (req, res) => {
  // Clear the user's session (assuming you're using express-session)
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).send("Internal Server Error");
    } else {
      // Redirect the user to the login page after logout
      res.redirect("/login");
    }
  });
});

// home page route
app.get("/", async function (req, res) {
  try {
    const movies = await fetchMovies(process.env.API_TOKEN);

    // console.log the movies to see what the data looks like
    // console.log(movies);

    res.render("pages/index", { movies });
  } catch (error) {
    console.error("Fetching movies failed:", error);
    res.status(500).send("Failed to fetch movies");
  }
});

// Define a route to handle the form submission
app.post("/save-post", async (req, res) => {
  try {
    const movies = await fetchMovies(process.env.API_TOKEN);
    // Extract the data from the request body
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

    console.log("Post saved:", postData);

    // Send a success response
    res.render("pages/index", { movies, message: "Post saved successfully", userId: req.session.userId });
  } catch (error) {
    // Log the error
    console.error("Error saving post:", error);
    // Send an error response
    res.status(500).send("Failed to save post");
  }
});

// account page route
app.get("/account", async function (req, res) {
  try {
    const userName = req.session.username;
    console.log("Username from session:", userName);

    const userLoggedIn = await users.findOne({ username: userName });
    console.log("User logged in:", userLoggedIn);

    const bookmarkedMovies = await posts.find({ userId: userLoggedIn._id.toString() }).toArray();

    res.render("pages/account", { user: userLoggedIn, bookmarkedMovies });
  } catch (error) {
    console.error("Fetching movies failed:", error);
    res.status(500).send("Failed to fetch movies");
  }
});

// Define your Express route to handle requests for movie details
app.get("/details", async (req, res) => {
  try {
    const movieId = req.query.movieId;

    // Call the fetchMovieDetails function to fetch movie details
    const movieDetails = await fetchMovieDetails(movieId, process.env.API_TOKEN);

    // Send the movie details back to the client
    res.json(movieDetails);
  } catch (error) {
    console.error("Error fetching movie details:", error);
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

// Search page route
app.get("/search", async (req, res) => {
  let movies = [];
  let title = "Search Movies";
  let { search } = req.query;

  try {
    const apiToken = process.env.API_TOKEN;
    if (search) {
      // Corrected URL to use the search endpoint instead of the discover endpoint
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiToken}&language=en-US&query=${encodeURIComponent(
        search
      )}&page=1&include_adult=false&sort_by=popularity.desc&primary_release_date.gte=2010-01-01`;
      const response = await fetch(url);
      const data = await response.json();
      movies = data.results;
      // title = `Search Results for "${search}"`;
      console.log(`Search query: ${search}`);

      console.log(movies);
    } else {
      // If no search query, show default movies
      console.log("No search query, fetching default movies");
      movies = await fetchMovies(apiToken);
    }

    // Render the search page with either search results or default movies
    res.render("pages/search", { movies, searchQuery: search });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
