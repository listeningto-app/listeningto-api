import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import IUser from '../interfaces/user.interface';
import { ConflictError } from '../services/errorHandling.service';

const userSchema = new mongoose.Schema<IUser>({
  username: {
    type: String,
    required: [true, "An username is required"],
    unique: true,
    minlength: [5, "Username must be at least 5 characters long"],
    maxlength: [16, "Username must have 16 characters or less"],
    match: [/^[a-zA-Z0-9_]*$/, "Username can only contain underscores and alphanumerical characters"]
  },
  email: {
    type: String,
    required: [true, "An email address is required"],
    unique: true,
    match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "The email address is not valid"]
  },
  password: {
    type: String,
    required: [true, "A password is required"]
  },
  profilePic: {
    type: String,
    default: "../../public/images/1/1.jpg"
  },
  createdAt: {
    type: Date,
    default: (): Date => { return new Date() },
    immutable: true
  },
  verifiedArtist: Boolean
});

// Checar existência de usuário com o mesmo username
userSchema.pre("save", function (this: IUser & mongoose.Document, next: Function) {
  let user = this;
  if (!user.isModified("username")) return next();

  mongoose.model("UserModel").where("username").equals(user.username!).then((doc) => {
      if (doc[0]) return next(new ConflictError("A user already exists with this username"));
      next();
    });
});

// Checar existência de usuário com o mesmo email
userSchema.pre("save", function (this: IUser & mongoose.Document, next: Function) {
  let user = this;
  if (!user.isModified("email")) return next();

  mongoose.model("UserModel").where("email").equals(user.email!).then((doc) => {
    if (doc[0]) return next(new ConflictError("A user already exists with this email address"));
    next();
  });
});

// Transformar password em hash
userSchema.pre("save", function (this: IUser & mongoose.Document, next: Function) {
  let user = this;
  if (!user.isModified("password")) return next();

  bcrypt.genSalt(12, (err, salt) => {
    if (err) return next(err);

    bcrypt.hash(user.password!, salt, (err, hash) => {
      if (err) return next(err);

      user.password = hash;
      next();
    });
  });
});

export default mongoose.model("UserModel", userSchema);