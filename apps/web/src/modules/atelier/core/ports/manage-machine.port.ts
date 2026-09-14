import type {
  AtelierResult,
  CreateMachineInput,
  ManagedMachine,
  ManagedParc,
  UpdateMachineInput,
} from '../model/atelier'

export interface IManageMachinePort {
  listParcs(token: string): Promise<AtelierResult<ReadonlyArray<ManagedParc>>>
  create(token: string, input: CreateMachineInput): Promise<AtelierResult<ManagedMachine>>
  update(token: string, id: string, input: UpdateMachineInput): Promise<AtelierResult<ManagedMachine>>
}
