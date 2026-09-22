import { isRequestable, type MyCertificationStatus } from '../../core/model/certification'
import { useMyCertifications } from './use-my-certifications'

export const useMachineCertification = (machineId: string) => {
  const mine = useMyCertifications()
  const certification = mine.certifications.find((candidate) => candidate.machineId === machineId) ?? null
  const status: MyCertificationStatus | null = certification?.status ?? null

  return {
    status,
    canRequest: status !== null && isRequestable(status),
    isRequesting: mine.requestedMachineId === machineId,
    error: mine.requestError,
    request: () => mine.request(machineId),
  }
}
