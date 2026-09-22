import type {
  AtelierResult,
  CreateMachineInput,
  ManagedMachine,
  ManagedParc,
  UpdateMachineInput,
} from '../model/atelier'

export interface IManageMachinePort {
  listParcs(): Promise<AtelierResult<ReadonlyArray<ManagedParc>>>
  create(input: CreateMachineInput): Promise<AtelierResult<ManagedMachine>>
  update(id: string, input: UpdateMachineInput): Promise<AtelierResult<ManagedMachine>>
  regenerateCheckInToken(id: string): Promise<AtelierResult<ManagedMachine>>
}
