import axios from 'axios'

export default class ApiService {

    url: string

    constructor(url: string) {
        this.url = url
    }

    async getFwiGeoJsonForDate(date: Date) {
        // format date to yyyy-mm-dd
        const formattedDate = date.toISOString().split('T')[0]
        const response = axios.post(`${this.url}/fwi/load`, {date: formattedDate})
        return (await response).data
    }
}
