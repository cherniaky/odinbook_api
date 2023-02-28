FROM node:14-alpine

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the app's source code to the container
COPY . .

# Expose the port that the app listens on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]