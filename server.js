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

// Define fetch function
async function fetchMovies(apiToken) {
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiToken}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&primary_release_date.gte=2010-01-01`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results;
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

// Registration form submission route
app.post('/register', upload.single('avatar'), async (req, res) => {
  try {
    // Get the username from the form
    // const { username } = req.body;
    
    // Create an object with user data
    const userData = {
      avatar: `/uploads/${req.file.filename}`,
      username: req.body.username,
      password: req.body.password,
      description: req.body.description,   
    };

    console.log("Received registration request with data:", userData);

    // Check if the username is already taken
    // const existingUser = await users.findOne({ username });
    // if (existingUser) {
    //   console.log('Username already exists:', username);
    //   return res.render('pages/login', { error: 'Username already exists. Please choose another one.' });
    // }

    // Insert the new user into the database
    await users.insertOne(userData);
    // console.log('User registered:', newUser);

    // Optionally, you can log the user in automatically after registration
    // req.session.userId = newUser.insertedId; // Set the userId session variable
    res.redirect('/');
  } catch (err) {
    console.error('Error registering user:', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

// home page route
app.get("/", async function (req, res) {
  try {
    const movies = await fetchMovies(process.env.API_TOKEN);

    // console.log the movies to see what the data looks like
    console.log(movies);

    res.render("pages/index", { movies });
  } catch (error) {
    console.error("Fetching movies failed:", error);
    res.status(500).send("Failed to fetch movies");
  }
});

// account page route
app.get("/account", async function (req, res) {
  try {
    const movies = await fetchMovies(process.env.API_TOKEN);

    // console.log the movies to see what the data looks like
    console.log(movies);

    res.render("pages/account", { movies });
  } catch (error) {
    console.error("Fetching movies failed:", error);
    res.status(500).send("Failed to fetch movies");
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
