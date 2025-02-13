// TODO: Create this new file for API client
/*
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
})

export const membersApi = {
  getAll: () => api.get<HouseholdMember[]>('/members'),
  getById: (id: string) => api.get<HouseholdMember>(`/members/${id}`),
  create: (member: Omit<HouseholdMember, "id">) => 
    api.post<HouseholdMember>('/members', member),
  update: (id: string, member: Omit<HouseholdMember, "id">) => 
    api.put<HouseholdMember>(`/members/${id}`, member),
  delete: (id: string) => api.delete(`/members/${id}`)
}
*/ 