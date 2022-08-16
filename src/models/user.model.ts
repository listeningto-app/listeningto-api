import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import IUser from "../interfaces/user.interface";
import { ConflictError } from "../services/errorHandling.service";

const UserSchema = new mongoose.Schema<IUser>({
  username: {
    type: String,
    required: [true, "Um nome de usuário é obrigatório"],
    minlength: [5, "O nome de usuário deve ter, no mínimo, cinco (5) caracteres"],
    maxlength: [24, "O nome de usuário não pode ter mais que vinte e quatro (24) caracteres"],
    match: [/^[a-zA-Z0-9_]*$/, "O nome de usuário pode conter apenas caracteres alfanuméricos"],
  },
  email: {
    type: String,
    required: [true, "Um endereço de email é obrigatório"],
    match: [
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "O endereço de email é inválido",
    ],
  },
  password: {
    type: String,
    required: [true, "Uma senha é obrigatória"],
  },
  profilePic: {
    type: String,
    default: "/images/1/ac1ae8c497a46b4263f35bb0f60d8fc0.png",
  }
}, { timestamps: true });

// Checar existência de usuário com o mesmo username
UserSchema.pre("save", function (this: IUser & mongoose.Document, next: Function) {
    let user = this;
    if (!user.isModified("username")) return next();

    mongoose.model("UserModel").where("username").equals(user.username!).then((doc) => {
      if (doc[0]) return next(new ConflictError("Um usuário de mesmo nome já existe"));

      next();
    });
  }
);

// Checar existência de usuário com o mesmo email
UserSchema.pre("save", function (this: IUser & mongoose.Document, next: Function) {
    let user = this;
    if (!user.isModified("email")) return next();

    mongoose.model("UserModel").where("email").equals(user.email!).then((doc) => {
      if (doc[0]) return next(new ConflictError("Um usuário de mesmo endereço de email já existe"));

      next();
    });
  }
);

// Transformar password em hash
UserSchema.pre("save", function (this: IUser & mongoose.Document, next: Function) {
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
  }
);

export default mongoose.model("UserModel", UserSchema);
