class Driver {
  constructor({
    name = '',
    email = '',
    isActived = false,
    phone = '',
    googleId = '',
    photo = '',
    password = '',
    typeUser = 'Driver',
    status = '',
    lastChange = new Date().toISOString(),
    creationDate = new Date().toISOString(),
    lastLogin = null,
    isEmailVerified = false,
    isPhoneVerified = false,
    language = 'en',
    nightMode = false,
    lastPasswordChange = null,
    aboutYou = '',
    identityCard = '',
    genre = '',
    isOnline = true,
  } = {}) {
    this.name = name;
    this.email = email;
    this.isActived = isActived;
    this.phone = phone;
    this.googleId = googleId;
    this.photo = photo;
    this.password = password;
    this.typeUser = typeUser;
    this.status = status;
    this.lastChange = lastChange;
    this.creationDate = creationDate;
    this.lastLogin = lastLogin;
    this.isEmailVerified = isEmailVerified;
    this.isPhoneVerified = isPhoneVerified;
    this.language = language;
    this.nightMode = nightMode;
    this.lastPasswordChange = lastPasswordChange;
    this.aboutYou = aboutYou;
    this.identityCard = identityCard;
    this.genre = genre;
    this.isOnline = isOnline;
  }

  toJson() {
    return {
      name: this.name,
      email: this.email,
      isActived: this.isActived,
      phone: this.phone,
      googleId: this.googleId,
      photo: this.photo,
      password: this.password,
      typeUser: this.typeUser,
      status: this.status,
      lastChange: this.lastChange,
      creationDate: this.creationDate,
      lastLogin: this.lastLogin,
      isEmailVerified: this.isEmailVerified,
      isPhoneVerified: this.isPhoneVerified,
      language: this.language,
      nightMode: this.nightMode,
      lastPasswordChange: this.lastPasswordChange,
      aboutYou: this.aboutYou,
      identityCard: this.identityCard,
      genre: this.genre,
      isOnline: this.isOnline,
    };
  }
}

export default Driver;
