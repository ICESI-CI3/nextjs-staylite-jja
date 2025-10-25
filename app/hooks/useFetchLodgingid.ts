import { useState, useEffect } from 'react'
import { Lodging } from '../interfaces/lodging'


const useidLodging = (id: string) => {
  const [lodging, setLodging] = useState<Lodging | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchLodging = async () => {
      console.log(`Fetching lodging with ID: ${id} from API...`)
      try {
        const response = await fetch(`http://localhost:3000/lodgings/${id}`)  
        if (!response.ok) {
          throw new Error(`HTTP Error! status: ${response.status}`)
        }

        const data = await response.json()

        console.log('Data fetched from API:', data)
        setLodging(data)
      } catch (error: any) {
        console.error('Error fetching lodging:', error)

        setError(error instanceof Error ? error.message : 'An unknown error occurred.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchLodging()
    }
  }, [id]) 

  return { lodging, loading, error }
}

export default useidLodging
