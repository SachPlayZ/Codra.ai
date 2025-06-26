# MongoDB Setup for Codra AI

This document explains how to set up MongoDB for the Codra AI project to store user data and enable GitHub profile pictures.

## Option 1: Local MongoDB Installation

### macOS (using Homebrew)

```bash
# Install MongoDB Community Edition
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start MongoDB service
brew services start mongodb-community@7.0

# Verify installation
mongosh --eval "db.version()"
```

### Ubuntu/Debian

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Windows

1. Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. Choose "Complete" installation
4. Install MongoDB as a service
5. Install MongoDB Compass (optional GUI)

## Option 2: MongoDB Atlas (Cloud - Recommended)

MongoDB Atlas is a cloud-hosted MongoDB service that's perfect for development and production.

1. **Create Account**

   - Visit [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account

2. **Create Cluster**

   - Click "Create a New Cluster"
   - Choose the free tier (M0 Sandbox)
   - Select a cloud provider and region
   - Name your cluster (e.g., "codra-ai-cluster")

3. **Configure Access**

   - **Database User**: Create a database user with read/write permissions
   - **Network Access**: Add your IP address (or `0.0.0.0/0` for development)

4. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

## Configuration

### Update Environment Variables

1. **Install Dependencies**:

   ```bash
   cd backend
   pnpm install mongoose
   ```

2. **Update your `.env` file**:

   ```env
   # For Local MongoDB
   MONGODB_URI=mongodb://localhost:27017/codra-ai

   # For MongoDB Atlas
   MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/codra-ai?retryWrites=true&w=majority
   ```

3. **Regenerate environment files** (if needed):
   ```bash
   cd backend
   rm .env
   pnpm run setup
   # Then manually update the MONGODB_URI in the generated .env file
   ```

## Database Schema

The application will automatically create the following collections:

### Users Collection

```javascript
{
  _id: ObjectId,
  githubId: String (unique),
  username: String,
  displayName: String,
  email: String,
  avatar: String,  // GitHub profile picture URL
  githubUrl: String,
  accessToken: String (encrypted),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Verification

To verify your MongoDB setup is working:

1. **Start the backend server**:

   ```bash
   cd backend
   pnpm run dev
   ```

2. **Check the console** for connection messages:

   ```
   ✅ MongoDB Connected: cluster-name-shard-00-00.mongodb.net:27017
   Server running on port 5000
   ```

3. **Test authentication** by logging in through GitHub OAuth
   - The user data should be automatically saved to MongoDB
   - Check the console for user creation/update messages

## Troubleshooting

### Common Issues

1. **Connection Timeout**

   - Check if MongoDB service is running
   - Verify network access settings (for Atlas)
   - Ensure correct connection string format

2. **Authentication Failed**

   - Verify database user credentials
   - Check if user has read/write permissions

3. **Network Access Denied**
   - Add your current IP address to Atlas whitelist
   - For development, you can use `0.0.0.0/0` (not recommended for production)

### Useful Commands

```bash
# Check MongoDB status (macOS)
brew services list | grep mongodb

# Connect to local MongoDB shell
mongosh

# View databases
show dbs

# Use your database
use codra-ai

# View collections
show collections

# Find users
db.users.find().pretty()
```

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for sensitive data
3. **Enable authentication** in production
4. **Restrict network access** to known IPs
5. **Use connection pooling** for better performance
6. **Regular backups** for production data

## Need Help?

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Atlas Tutorial](https://docs.atlas.mongodb.com/getting-started/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)

Your users will now have their GitHub profile pictures displayed throughout the application with automatic fallback to beautiful gradient initials if the image fails to load!
