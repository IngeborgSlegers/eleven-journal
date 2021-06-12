const router = require("express").Router();

router.post("/new", async (req, res) => {
  const user = req.user;
  const { profile } = req.body;

  try {
    const { firstName, lastName, userName, phoneNumber, bio } = profile;

    let foundProfile = await ProfileModel.findOne({
      where: { userId: user.id },
    });

    if (foundProfile) {
      return {
        statusCode: 409,
        message: "Already associated Profile detected",
      };
    } else {
      await ProfileModel.create({
        firstName,
        lastName,
        userName,
        phoneNumber,
        bio,
        userId: user.id,
      });
      res.status(201).json({
        message: "Successful profile creation",
      });
    }
  } catch (error) {
    res.status(500).json({
      error: `[Error:] ${error}`,
    });
  }
});

router.get("/myprofile", async (req, res) => {
  const user = req.user;

  try {
    const myProfile = await ProfileModel.findOne({
      where: {
        userId: user.id,
      },
      include: [
        {
          model: UserModel,
          attributes: ["id", "email"],
          required: true,
          include: [
            {
              model: JournalModel,
              where: {
                userId: user.id,
              },
            },
          ],
        },
      ],
    });
    if (myProfile) {
      res.status(200).json({
        statusCode: 200,
        message: "Profile successfully retrieved",
        myProfile,
      });
    } else {
      res.status(204);
    }
  } catch (error) {
    res.status(500).json({
      error: `[Error:] ${error}`,
    });
  }
});

router.delete("/delete", async (req, res) => {
  const user = req.user;

  try {
    const foundProfile = await ProfileModel.findOne({
      where: {
        userId: user.id,
      },
    });
    if (foundProfile) {
      await foundProfile.destroy();
      res.status(200).json({
        message: "Successful profile delete"
      });
    } else {
      res.status(404).json({
        message: "User does not have an associated profile"
      });
    }
  } catch (error) {
    res.status(500).json({
      error: `[Error:] ${error}`
    });
  }

  res.status(statusCode).json({
    message,
  });
});

router.put("/update", async (req, res) => {
  const user = req.user;
  const { profile } = req.body;

  try {
    const foundProfile = await ProfileModel.findOne({
      where: {
        userId: user.id,
      },
    });
    if (foundProfile) {
      await foundProfile.update(profile);
      res.status(200).json({
        message: "Successful profile update" 
      })
    } else {
      res.status(404).json({
        message: "User does not have an associated profile"
      });
    }
  } catch (error) {
    res.status(500).json({
      error: `[Error:] ${error}`
    });
  }
});

module.exports = router;
