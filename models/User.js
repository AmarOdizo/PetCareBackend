let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  mongoose = null;
}

let User = null;

if (mongoose) {
  try {
    const UserSchema = new mongoose.Schema(
      {
        name: {
          type: String,
          required: [true, "Name is required"],
          trim: true
        },
        email: {
          type: String,
          required: [true, "Email is required"],
          unique: true,
          lowercase: true,
          trim: true
        },
        password: {
          type: String,
          required: [true, "Password is required"]
        },
        role: {
          type: String,
          enum: ["owner", "doctor", "admin"],
          default: "owner"
        },
        phone: {
          type: String,
          default: ""
        }
      },
      {
        timestamps: true
      }
    );

    User = mongoose.models.User || mongoose.model('User', UserSchema);
  } catch (e) {
    User = null;
  }
}

module.exports = User;
