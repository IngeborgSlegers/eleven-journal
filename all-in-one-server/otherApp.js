require("dotenv").config();
const Express = require("express");
const app = Express();
const { Sequelize, DataTypes } = require("sequelize");
const { UniqueConstraintError } = require("sequelize/lib/errors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const dbConnection = new Sequelize(process.env.DATABASE_URL);

app.use(Express.json());

/* 
=======================
User Model and "Controller"
=======================
*/
const UserModel = dbConnection.define("user", {
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(),
    allowNull: false,
  },
});

app.use(
  "/user",
  Express.Router()
    .post("/register", async (req, res) => {
      let { email, password } = req.body.user;
      try {
        const User = await UserModel.create({
          email,
          password: bcrypt.hashSync(password, 13),
        });

        let token = jwt.sign({ id: User.id }, process.env.JWT_SECRET, {
          expiresIn: 60 * 60 * 24,
        });

        res.status(201).json({
          message: "User successfully registered",
          user: User,
          sessionToken: token,
        });
      } catch (err) {
        if (err instanceof UniqueConstraintError) {
          res.status(409).json({
            message: "Email already in use",
          });
        } else {
          res.status(500).json({
            message: "Failed to register user",
          });
        }
      }
    })
    .post("/user/login", async (req, res) => {
      let { email, password } = req.body.user;

      try {
        let loginUser = await UserModel.findOne({
          where: {
            email: email,
          },
        });

        if (loginUser) {
          let passwordComparison = await bcrypt.compare(
            password,
            loginUser.password
          );

          if (passwordComparison) {
            let token = jwt.sign({ id: loginUser.id }, process.env.JWT_SECRET, {
              expiresIn: 60 * 60 * 24,
            });

            res.status(200).json({
              user: loginUser,
              message: "User successfully logged in!",
              sessionToken: token,
            });
          } else {
            res.status(401).json({
              message: "Incorrect email or password",
            });
          }
        } else {
          res.status(401).json({
            message: "Incorrect email or password",
          });
        }
      } catch (error) {
        res.status(500).json({
          message: "Failed to log user in",
        });
      }
    })
);

/* 
==============================
JWT_Token Validation Function
==============================
*/
const validateJWT = async (req, res, next) => {
  if (req.method == "OPTIONS") {
    next();
  } else if (
    req.headers.authorization &&
    req.headers.authorization.includes("Bearer")
  ) {
    const { authorization } = req.headers;
    console.log("authorization -->", authorization);
    const payload = authorization
      ? jwt.verify(
          authorization.includes("Bearer")
            ? authorization.split(" ")[1]
            : authorization,
          process.env.JWT_SECRET
        )
      : undefined;

    console.log("payload -->", payload);

    if (payload) {
      let foundUser = await UserModel.findOne({ where: { id: payload.id } });
      console.log("foundUser -->", foundUser);

      if (foundUser) {
        req.user = foundUser;

        next();
      } else {
        res.status(400).send({ message: "Not Authorized" });
      }
    } else {
      res.status(401).send({ message: "Invalid token" });
    }
  } else {
    res.status(403).send({ message: "Forbidden" });
  }
};

/* 
===============================
Journal Model and "Controller"
===============================
*/
const JournalModel = dbConnection.define("journal", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entry: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});


app.use(
  "/journal",
  Express.Router()
  .post("/new", validateJWT, async (req, res) => {
    const { title, date, entry } = req.body.journal;
    const { id } = req.user;
    const journalEntry = {
      title,
      date,
      entry,
      owner: id,
    };
    try {
      const newJournal = await JournalModel.create(journalEntry);
      res.status(200).json(newJournal);
    } catch (err) {
      res.status(500).json({ error: err });
    }
  })
  .get("/", async (req, res) => {
    try {
      const entries = await JournalModel.findAll();
      res.status(200).json(entries);
    } catch (err) {
      res.status(500).json({ error: err });
    }
  })
  .get("/mine", validateJWT, async (req, res) => {
    let { id } = req.user;
    try {
      const userJournals = await JournalModel.findAll({
        where: {
          owner: id,
        },
      });
      res.status(200).json(userJournals);
    } catch (err) {
      res.status(500).json({ error: err });
    }
  })
  .get("/:title", async (req, res) => {
    const { title } = req.params;
    try {
      const results = await JournalModel.findAll({
        where: { title: title },
      });
      res.status(200).json(results);
    } catch (err) {
      res.status(500).json({ error: err });
    }
  })
  .put("/update/:entryId", validateJWT, async (req, res) => {
    const { title, date, entry } = req.body.journal;
    const journalId = req.params.entryId;
    const userId = req.user.id;

    const query = {
      where: {
        id: journalId,
        owner: userId,
      },
    };

    const updatedJournal = {
      title: title,
      date: date,
      entry: entry,
    };

    try {
      const update = await JournalModel.update(updatedJournal, query);
      res.status(200).json(update);
    } catch (err) {
      res.status(500).json({ error: err });
    }
  })
  .delete("/delete/:id", validateJWT, async (req, res) => {
    const ownerId = req.user.id;
    const journalId = req.params.id;
  
    try {
      const query = {
        where: {
          id: journalId,
          owner: ownerId,
        },
      };
  
      await JournalModel.destroy(query);
      res.status(200).json({ message: "Journal Entry Removed" });
    } catch (err) {
      res.status(500).json({ error: err });
    }
  })
);

dbConnection
  .authenticate()
  .then(() => dbConnection.sync())
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`[Server]: App is listening on ${process.env.PORT}.`);
    });
  })
  .catch((err) => {
    console.log(`[Server]: Server crashed. Error = ${err}`);
  });
