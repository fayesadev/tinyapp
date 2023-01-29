///  HELPER FUNCTIONS ///
//Creates a randomly generated string of 6 characters --to be used to make a unique ID
const generateRandomString = function() {
  let result = '';
  const char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const strLength = 6;
  for (let i = 0; i < strLength; i++) {
    result += char.charAt(Math.floor(Math.random() * char.length));
  }
  return result;
};

//Returns an object with a shortened ID and its long URL as key-value pairs for a specific user
const urlsForUser = function(id, database) {
  const urls = {};
  for (let key in database) {
    if (database[key].userID === id) {
      urls[key] = database[key].longURL;
    }
  }
  return urls;
};

//Returns a specific users object given an email
const getUserByEmail = function(email, database) {
  for (let user in database) {
    if (database[user].email === email) {
      return database[user];
    };
  };
  return undefined;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser };