# Phase 5 Testing Guide - User Preferences & AQI Alerts

This guide covers testing the new features introduced in Phase 5: User Preferences & AQI Alert System.

## 🧪 Test Categories

### 1. User Preferences Testing

#### Test Basic Preference Operations
```bash
# Get user preferences (should create defaults if none exist)
curl -X GET http://localhost:5000/api/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update preferences
curl -X PUT http://localhost:5000/api/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alertSettings": {
      "enabled": true,
      "thresholds": {
        "aqi": {
          "moderate": 120,
          "unhealthy": 160,
          "veryUnhealthy": 220,
          "hazardous": 320
        }
      },
      "notifications": {
        "email": true,
        "sms": false
      }
    }
  }'

# Reset preferences to defaults
curl -X DELETE http://localhost:5000/api/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Test Location Management
```bash
# Add preferred location
curl -X POST http://localhost:5000/api/preferences/locations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Mumbai",
    "country": "India",
    "coordinates": {
      "latitude": 19.0760,
      "longitude": 72.8777
    }
  }'

# Remove preferred location
curl -X DELETE http://localhost:5000/api/preferences/locations/Mumbai \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Test Threshold Updates
```bash
# Update AQI thresholds
curl -X PUT http://localhost:5000/api/preferences/thresholds \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "aqi": {
      "moderate": 100,
      "unhealthy": 150,
      "veryUnhealthy": 200,
      "hazardous": 300
    },
    "pollutants": {
      "pm2_5": 25.0,
      "pm10": 45.0
    }
  }'
```

#### Test Contact Information
```bash
# Update contact info
curl -X PUT http://localhost:5000/api/preferences/contact \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "whatsappNumber": "+1234567890"
  }'
```

### 2. Notification Testing

#### Test Email Notification
```bash
# Send test email
curl -X POST http://localhost:5000/api/preferences/test-notification \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "email"
  }'
```

#### Test SMS Notification (requires Twilio setup)
```bash
# Send test SMS
curl -X POST http://localhost:5000/api/preferences/test-notification \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "sms"
  }'
```

### 3. Alert Management Testing

#### Test Manual Alert Sending
```bash
# Send manual alert to location
curl -X POST http://localhost:5000/api/alerts/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Delhi",
    "message": "Test alert: High pollution levels detected.",
    "alertLevel": "unhealthy"
  }'

# Send alert to specific users
curl -X POST http://localhost:5000/api/alerts/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["USER_ID_1", "USER_ID_2"],
    "message": "Test alert for specific users.",
    "alertLevel": "moderate"
  }'
```

#### Test Alert History
```bash
# Get user alert history
curl -X GET "http://localhost:5000/api/alerts/history?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get filtered alert history
curl -X GET "http://localhost:5000/api/alerts/history?alertType=aqi_threshold&alertLevel=unhealthy&isRead=false" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get alert statistics
curl -X GET "http://localhost:5000/api/alerts/stats?days=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get unread alerts count
curl -X GET http://localhost:5000/api/alerts/unread-count \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Test Alert Actions
```bash
# Mark all alerts as read
curl -X PUT http://localhost:5000/api/alerts/mark-read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Mark specific alerts as read
curl -X PUT http://localhost:5000/api/alerts/mark-read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alertIds": ["ALERT_ID_1", "ALERT_ID_2"]
  }'

# Record user action on alert
curl -X PUT http://localhost:5000/api/alerts/ALERT_ID/action \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "clicked"
  }'
```

### 4. Scheduler Testing

#### Test Alert Scheduler
```bash
# Trigger immediate alert check
curl -X POST http://localhost:5000/api/alerts/check-now \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get scheduler status
curl -X GET http://localhost:5000/api/alerts/scheduler-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Run specific scheduler job
curl -X POST http://localhost:5000/api/alerts/run-job \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobName": "main_alert_check"
  }'
```

## 🔧 Environment Setup for Testing

### Email Testing (Gmail)
1. Enable 2-factor authentication on Gmail
2. Generate app-specific password
3. Set environment variables:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=noreply@yourapp.com
```

### SMS/WhatsApp Testing (Twilio)
1. Create Twilio account
2. Get Account SID and Auth Token
3. Get phone number for SMS
4. Set environment variables:
```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+14155238886
```

## 🧪 Automated Testing Scenarios

### Scenario 1: Complete User Preference Flow
```javascript
// Test script example
describe('User Preferences Flow', () => {
  test('Should create default preferences for new user', async () => {
    const response = await request(app)
      .get('/api/preferences')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data.alertSettings.enabled).toBe(true);
  });

  test('Should update alert thresholds', async () => {
    const newThresholds = {
      aqi: {
        moderate: 120,
        unhealthy: 160,
        veryUnhealthy: 220,
        hazardous: 320
      }
    };

    const response = await request(app)
      .put('/api/preferences/thresholds')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newThresholds);
    
    expect(response.status).toBe(200);
    expect(response.body.data.alertSettings.thresholds.aqi.moderate).toBe(120);
  });
});
```

### Scenario 2: Alert System Integration
```javascript
describe('Alert System', () => {
  test('Should send email notification', async () => {
    const response = await request(app)
      .post('/api/preferences/test-notification')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ method: 'email' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('Should create alert log entry', async () => {
    const alertData = {
      location: 'TestCity',
      message: 'Test alert message',
      alertLevel: 'moderate'
    };

    const response = await request(app)
      .post('/api/alerts/send')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(alertData);
    
    expect(response.status).toBe(200);
    expect(response.body.data.targetUsers).toBeGreaterThan(0);
  });
});
```

## 🔍 Validation Points

### Database Validation
```javascript
// Check if preferences are stored correctly
const preferences = await Preference.findOne({ userId });
console.log('Stored preferences:', preferences);

// Check alert logs
const alertLogs = await AlertLog.find({ userId }).sort({ createdAt: -1 });
console.log('Recent alerts:', alertLogs);
```

### Service Health Validation
```javascript
// Check notification service health
const notificationService = require('./services/notificationService');
const health = await notificationService.checkServiceHealth();
console.log('Service health:', health);
```

## 🐛 Common Issues & Troubleshooting

### Issue 1: Email not sending
**Symptoms:** Test notification returns success but no email received
**Solutions:**
- Check spam/junk folder
- Verify Gmail app password is correct
- Check EMAIL_HOST and EMAIL_PORT settings
- Ensure less secure app access is disabled (use app password)

### Issue 2: SMS not working
**Symptoms:** SMS test fails with authentication error
**Solutions:**
- Verify Twilio credentials
- Check phone number format (+country code)
- Ensure Twilio account has sufficient balance
- Verify phone number is verified in Twilio console

### Issue 3: Scheduler not running
**Symptoms:** Alerts not being sent automatically
**Solutions:**
- Check server logs for scheduler startup messages
- Verify cron expressions are valid
- Ensure NODE_ENV is not 'test'
- Check if alertScheduler.start() is called

### Issue 4: Alert thresholds not working
**Symptoms:** Alerts not triggered when AQI exceeds threshold
**Solutions:**
- Verify user has active preferred locations
- Check if alertSettings.enabled is true
- Ensure AQI data is being fetched correctly
- Check rate limiting (alerts sent within cooldown period)

## 📊 Performance Testing

### Load Testing Alert System
```bash
# Test concurrent alert checks
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/alerts/check-now \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" &
done
wait
```

### Database Performance
```javascript
// Test preference queries performance
console.time('Preference Query');
const preferences = await Preference.find({ 'alertSettings.enabled': true });
console.timeEnd('Preference Query');

// Test alert log queries
console.time('Alert History Query');
const alerts = await AlertLog.find({ userId }).limit(50);
console.timeEnd('Alert History Query');
```

## ✅ Testing Checklist

- [ ] User can create and update preferences
- [ ] Location management works correctly
- [ ] Alert thresholds can be customized
- [ ] Email notifications are sent successfully
- [ ] SMS notifications work (if configured)
- [ ] WhatsApp notifications work (if configured)
- [ ] Manual alerts can be sent
- [ ] Alert history is accessible
- [ ] Alerts can be marked as read
- [ ] Scheduler runs background jobs
- [ ] Alert rate limiting works
- [ ] Service health checks function
- [ ] Database models validate correctly
- [ ] Error handling works for invalid inputs
- [ ] Authentication is required for all endpoints
