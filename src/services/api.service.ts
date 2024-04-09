import axios from 'axios'

export default class ApiService {

    url: string
    fwiAbortController = new AbortController()
    firesAbortController = new AbortController()

    constructor(url: string) {
        this.url = url
    }

    formatDate(date: Date) {
        return date.toISOString().split('T')[0]
    }

    async getFwiGeoJsonForDate(date: Date) {
        try {
            this.fwiAbortController.abort()
            this.fwiAbortController = new AbortController()

            const response = await axios.post(`${this.url}/fwi/load`, {date: this.formatDate(date)}, {signal: this.fwiAbortController.signal})
            return response.data
        } catch (e) {
            if (axios.isAxiosError(e) && (e.code === 'ERR_CANCELED')) {
                return null
            }
            throw e
        }
    }

    async getFiresGeoJsonForDate(date: Date) {
        try {
            this.firesAbortController.abort()
            this.firesAbortController = new AbortController()

            const response = await axios.post(`${this.url}/wildfires/load`, {date: this.formatDate(date)}, {signal: this.firesAbortController.signal})
            return response.data
        } catch (e) {
            if (axios.isAxiosError(e) && (e.code === 'ERR_CANCELED')) {
                return null
            }
            throw e
        }
    }

    onTearDown() {
        this.firesAbortController.abort()
        this.fwiAbortController.abort()
    }
}
