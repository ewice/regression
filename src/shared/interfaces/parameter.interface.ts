import { ActivationIdentifier } from '../enums/activation-identifier.enum';
import { Optimizer } from '../enums/optimizer.enum';

export interface ParameterInterface {
  fitting: string;
  hidden: number;
  neuron: number;
  weight: number;
  activation: ActivationIdentifier;
  learningRate: number;
  optimizer: Optimizer;
  epochs: number;
}
