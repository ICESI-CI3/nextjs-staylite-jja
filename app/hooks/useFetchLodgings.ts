import { useState, useEffect } from 'react'
import { Lodging } from '../interfaces/lodging'

const useFetchLodgings = () => {
  const [lodgings, setLodgings] = useState<Lodging[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchLodgings = async () => {
      console.log('Fetching lodgings from API...')
      try {
        const response = await fetch('http://localhost:3000/lodgings')  
        if (!response.ok) {
          throw new Error(`HTTP Error! status: ${response.status}`)
        }

        const data = await response.json()

        console.log('Data fetched from API:', data)
        setLodgings(data)
      } catch (error: any) {
        console.error('Error fetching lodgings:', error)

        if (error instanceof Error) {
          setError(`Error: ${error.message}`)  
          setError('An unknown error occurred.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchLodgings()
  }, [])  

  return { lodgings, loading, error }


  
}

export default useFetchLodgings
