const mongoose = require('mongoose');

let FavoriteVet = null;

try {
  const favoriteVetSchema = new mongoose.Schema({
    ownerId: {
      type: String,
      required: true
    },
    vetId: {
      type: String,
      required: true
    },
    favoriteProfileImage: {
      type: String,
      default: ''
    }
  }, { timestamps: true });

  FavoriteVet = mongoose.models.FavoriteVet || mongoose.model('FavoriteVet', favoriteVetSchema);
} catch (e) {
  FavoriteVet = null;
}

module.exports = FavoriteVet;
