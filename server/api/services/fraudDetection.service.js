import axios from 'axios';

class FraudDetectionService {
    constructor() {
        this.fraudDetectionUrl = 'http://localhost:5005';
        this.timeout = 10000;
    }
            
    async detectFraud(listingData) {
        try {
            const { regularPrice, discountPrice, bedRooms, address } = listingData;
            const city = this.extractCityFromAddress(address);
            const estimatedArea = bedRooms * 300;

            const payload = {
                price: regularPrice || discountPrice,
                area: estimatedArea,
                bedrooms: bedRooms,
                city: city
            };

            console.log('Sending fraud detection request:', payload);

            const response = await axios.post(
                `${this.fraudDetectionUrl}/detect-fraud`,
                payload,
                {
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                const fraudData = response.data;
                console.log('Fraud detection result:', fraudData);

                return {
                    fraudScore: fraudData.fraudScore,
                    isFraudulent: fraudData.isFraudulent,
                    anomalyScore: fraudData.anomalyScore,
                    detectedAt: new Date(),
                    fraudFeatures: fraudData.features
                };
            } else {
                throw new Error(`Fraud detection service returned status ${response.status}`);
            }

        } catch (error) {
            console.error('Error in fraud detection:', error.message);

            return {
                fraudScore: null,
                isFraudulent: false,
                anomalyScore: null,
                detectedAt: new Date(),
                fraudFeatures: null,
                error: error.message
            };
        }
    }

    extractCityFromAddress(address) {
        if (!address) return 'Unknown';

        const addressParts = address.split(',');
        if (addressParts.length > 1) {
            return addressParts[addressParts.length - 1].trim();
        }

        const cityPatterns = [
            /Mumbai/i, /Delhi/i, /Bangalore/i, /Chennai/i, /Kolkata/i,
            /Hyderabad/i, /Pune/i, /Ahmedabad/i, /Jaipur/i, /Lucknow/i,
            /Chandigarh/i, /Indore/i, /Bhopal/i, /Kochi/i, /Coimbatore/i
        ];

        for (const pattern of cityPatterns) {
            const match = address.match(pattern);
            if (match) {
                return match[0];
            }
        }

        return 'Unknown';
    }

    async checkHealth() {
        try {
            const response = await axios.get(
                `${this.fraudDetectionUrl}/health`,
                { timeout: 5000 }
            );
            return response.status === 200;
        } catch (error) {
            console.error('Fraud detection service health check failed:', error.message);
            return false;
        }
    }

    async retrainModel() {
        try {
            const response = await axios.post(
                `${this.fraudDetectionUrl}/retrain`,
                {},
                { timeout: 30000 }
            );

            return {
                success: true,
                message: response.data.message,
                timestamp: response.data.timestamp
            };
        } catch (error) {
            console.error('Error retraining fraud detection model:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default new FraudDetectionService();
