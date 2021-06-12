const UserModel = require('./user');
const JournalModel = require('./journal');
const ProfileModel = require('./profile');

UserModel.hasMany(JournalModel);
JournalModel.belongsTo(UserModel);

UserModel.hasOne(ProfileModel);
ProfileModel.belongsTo(UserModel)

module.exports = {
  UserModel,
  JournalModel,
  ProfileModel
};