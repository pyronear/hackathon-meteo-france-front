import axios from 'axios'

export default class ApiService {

    url: string
    abortController = new AbortController()

    constructor(url: string) {
        this.url = url
    }

    async getFwiGeoJsonForDate(date: Date) {
        try {
            this.abortController.abort()
            this.abortController = new AbortController()

            const formattedDate = date.toISOString().split('T')[0]
            const response = await axios.post(`${this.url}/fwi/load`, {date: formattedDate}, {signal: this.abortController.signal})
            return response.data
        } catch (e) {
            if (axios.isAxiosError(e) && (e.code === 'ERR_CANCELED')) {
                return null
            }
            throw e
        }

    }
}
