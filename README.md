# Smart Travel Planner

A web application that helps users plan trips by aggregating travel information including attractions, hotels, restaurants, and weather data.

## Features

- Search destinations worldwide
- View attractions, hotels, and restaurants
- Filter by rating
- Search within results
- Responsive design (mobile-friendly)
- Load-balanced deployment

## Live Demo

- **Production URL:** http://smart-travel-planner.ineza.tech
- **Load Balancer:** 6866-lb-01, used Nginx round-robin between 2 servers
- **Backend Servers:**
  - 6866-web-01
  - 6866-web-02

## APIs Used

### 1. Travel Advisor API (RapidAPI)

- **Purpose:** Fetch attractions, hotels, and restaurants
- **Documentation:** https://rapidapi.com/apidojo/api/travel-advisor
- **Credit:** Powered by TripAdvisor data via RapidAPI
- **Rate Limit:** 500 requests/month (free tier)

## Local Setup

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- API keys (see below)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/inezakevin23/smart-travel-planner
cd smart-travel-planner
```

2. **Configure API keys**

```bash
# Copy the example config
cp scripts/config.example.js scripts/config.js

# Edit config.js and add your API keys
nano scripts/config.js
```

3. **Get API keys**

**RapidAPI (Travel Advisor):**

- Sign up at https://rapidapi.com/
- Subscribe to "Travel Advisor API" (free tier)
- Copy your API key from dashboard
- Paste in `scripts/config.js`

4. **Run locally**

**Option A: Python HTTP Server**

```bash
python3 -m http.server 8000
# Visit: http://localhost:8000
```

**Option B: VS Code Live Server**

- Install "Live Server" extension
- Right-click `index.html`
- Select "Open with Live Server"

## 🖥️ Deployment

### Architecture

```
                  Internet
                     ↓
          Nginx Load Balancer (6866-lb-01)
                     ↓
       ┌─────────────┴─────────────┐
       ↓                           ↓
  Web Server 1 ()             Web Server 2
  Nginx + App Files         Nginx + App Files
```

### Deployment Steps (how I deployed)

#### 1. Deploy to Web Servers

**On each server (web-01 and web-02):**

```bash
# SSH into my server
ssh username@server_ip

# Install Nginx
sudo apt update
sudo apt install nginx -y

# Clone repository
sudo git clone https://github.com/inezakevin23/smart-travel-planner /var/www/smart-travel-planner

# Set ownership
sudo chown -R $USER:$USER /var/www/smart-travel-planner

# Configure API keys
cd /var/www/smart-travel-planner
cp scripts/config.example.js scripts/config.js
nano scripts/config.js
# Paste API keys and save

# Configure Nginx
sudo nano /etc/nginx/sites-available/smart-travel-planner
```

**Nginx configuration:**

```Nginx
server {
    # Listen on port 80 (HTTP)
    listen 80;
    listen [::]:80;

    # Server name
    server_name smart-travel-planner.ineza.tech www.smart-travel-planner.ineza.tech;

    add_header X-Served-By $HOSTNAME;

    # Document root
    root /var/www/smart-travel-planner;

    # Index file
    index index.html;

    # Logging
    access_log /var/log/nginx/travel-planner-access.log;
    error_log /var/log/nginx/travel-planner-error.log;

    # Main location block
    location / {
        try_files $uri $uri/ =404;
    }

    # Cache static files (CSS, JS, images)
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;
}
```

**Enable and start:**

```bash
sudo ln -s /etc/nginx/sites-available/smart-travel-planner /etc/nginx/sites-enabled/smart-travel-planner
sudo nginx -t
sudo systemctl reload nginx
```

#### 2. Configure Load Balancer

**On Lb-01:**

```bash
# Install Nginx
sudo apt update
sudo apt install nginx -y

# Create load balancer config
sudo nano /etc/nginx/sites-available/smart-travel-planner
```

**Load balancer configuration:**

```nginx
# Upstream block
upstream travel_planner_backend {
    # Load balancing method: round-robin (default)

    # Backend server 1 (Web01)
    server 54.234.228.94 max_fails=3 fail_timeout=30s;

    # Backend server 2 (Web02)
    server 3.82.113.10 max_fails=3 fail_timeout=30s;

    # Keep connections alive for better performance
    keepalive 32;
}

# Main server block
server {
    # Server name
    server_name smart-travel-planner.ineza.tech www.smart-travel-planner.ineza.tech;

    # Access and error logs
    access_log /var/log/nginx/lb-access.log;
    error_log /var/log/nginx/lb-error.log;

    # Main location - proxy all requests to backend
    location / {
        # Pass request to backend servers
        proxy_pass http://travel_planner_backend;

        # Add headers to backend servers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Proxy timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;

        # Enable keepalive to backends
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }


    listen [::]:443 ssl; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/smart-travel-planner.ineza.tech/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/smart-travel-planner.ineza.tech/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot




}

server {
    if ($host = smart-travel-planner.ineza.tech) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = www.smart-travel-planner.ineza.tech) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    listen [::]:80;
    server_name smart-travel-planner.ineza.tech www.smart-travel-planner.ineza.tech;
    return 404; # managed by Certbot


}
```

**Enable and start:**

```bash
sudo ln -s /etc/nginx/sites-available/smart-travel-planner /etc/nginx/sites-enabled/smart-travel-planner
sudo nginx -t
sudo systemctl reload nginx
```

### Testing Deployment

```bash
curl https://smart-travel-planner.ineza.tech

# Test load balancing (run multiple times)
curl -sI https://smart-travel-planner.ineza.tech | grep X-Served-By
```

## Testing

### Manual Testing

1. Search for "Paris" - should show attractions, hotels, restaurants
2. Apply filters - minimum rating 4.0+
3. Search within results - search for "Eiffel"
4. Switch tabs - attractions, hotels, restaurants
5. sort by rating or alphabetical order

### Browser Testing

- Chrome DevTools (F12) - check for errors
- Network tab - verify API calls succeed
- Mobile responsive - test on phone

## Key Features Demo

### Search Functionality

- Enter destination (e.g., "Tokyo")
- Select category (All/Attractions/Hotels/Restaurants)
- Click Search
- watch Results

### Filtering

- ✅ Minimum Rating 4.0+
- ✅ Search within results

### Load Balancing

- Traffic distributed between 2 servers
- Automatic failover if one server fails
- Round-robin algorithm

## Challenges & Solutions

### Challenge 1: CORS Issues with APIs

**Problem:** Browser blocked API requests due to CORS policy

**Solution:**

- Used APIs that support CORS (Travel Advisor via RapidAPI)
- Added proper headers in API requests
- Tested with Postman first

### Challenge 2: API Key Security

**Problem:** Risk of exposing keys in Git

**Solution:**

- Created `.gitignore` to exclude `config.js`
- Provided `config.example.js` template
- Manual configuration on servers

## Project Structure

```
smart-travel-planner/
├── index.html              # Main HTML page
├── styles/
│   └── styles.css         # All styling
├── scripts/
│   ├── config.example.js  # API key template
│   ├── api.js             # API service layer
│   ├── ui.js              # UI rendering
│   └── main.js            # Main app logic
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Security

- API keys stored in separate config file (not in Git)
- Security headers enabled (X-Frame-Options, X-XSS-Protection)
- **Firewall (UFW):** Configured UFW on all servers to allow only incoming connections on `22/tcp`, `80/tcp`, and `443/tcp`.
- Input validation on search queries
- HTTPS ready

### UFW configuration on all servers

```bash
sudo apt install ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

sudo ufw enable
```

## Performance Optimizations

- Static file caching (30 days)
- Gzip compression (70% size reduction)
- Connection keepalive
- Efficient DOM updates

## Credits

### APIs

- **Travel Advisor API** by RapidAPI - https://rapidapi.com/apidojo/api/travel-advisor

## Demo Video

[https://youtu.be/hqoAOzv4iD0]
