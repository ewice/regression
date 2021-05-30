import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ParameterInterface } from '../../shared/interfaces/parameter.interface';
import * as tf from '@tensorflow/tfjs';
import { Optimizer } from '../../shared/enums/optimizer.enum';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
// @ts-ignore
import * as data from '../../assets/data.json';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ChartOptions, ChartType } from 'chart.js';

@Component({
  selector: 'app-model',
  templateUrl: './model.component.html',
  styleUrls: ['./model.component.sass'],
})
export class ModelComponent implements OnChanges {
  @Input() parameters!: ParameterInterface;
  @Output() isTraining = new EventEmitter<boolean>();
  training = true;
  faArrowRight = faArrowRight;
  learningData: any = (data as any).default;
  model: any;
  predictedYValue: number | undefined;
  actualYValue: number | undefined;

  // Form
  predictForm = new FormGroup({
    xValue: new FormControl('normal-fitting', Validators.required),
  });

  // Scatter Chart
  scatterChartOptions: ChartOptions = {
    responsive: true,
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
      },
    },
  };
  scatterChartData: any;
  scatterChartType: ChartType = 'scatter';

  constructor() {}

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    this.predictedYValue = undefined;
    this.actualYValue = undefined;
    this.isTraining.emit(true);
    this.training = true;
    await this.run();
    this.training = false;
    this.isTraining.emit(false);
  }

  async run() {
    const values = this.learningData.map((d: any) => ({
      x: d.x,
      y: d.y,
    }));

    this.createModel();
    const tensorData = this.convertToTensor(values);
    const { inputs, labels } = tensorData;
    await this.trainModel(inputs, labels);
    await this.testModel(values, tensorData);
  }

  createModel(): void {
    tf.tidy(() => {
      this.model = tf.sequential();

      this.model.add(tf.layers.dense({ inputShape: [1], units: 1, useBias: true }));

      // Hidden Layer
      for (let i = 0; i < this.parameters.hidden; i++) {
        this.model.add(
          tf.layers.dense({
            units: this.parameters.neuron,
            activation: this.parameters.activation,
          })
        );
      }

      this.model.add(tf.layers.dense({ units: 1, useBias: true }));
    });
  }

  convertToTensor(values: any): any {

    return tf.tidy(() => {
      tf.util.shuffle(values);

      const inputs = values.map((d: any) => d.x);
      const labels = values.map((d: any) => d.y);

      const inputTensor = tf.tensor2d(inputs, [inputs.length, 1]);
      const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

      const inputMax = inputTensor.max();
      const inputMin = inputTensor.min();
      const labelMax = labelTensor.max();
      const labelMin = labelTensor.min();

      const normalizedInputs = inputTensor
        .sub(inputMin)
        .div(inputMax.sub(inputMin));
      const normalizedLabels = labelTensor
        .sub(labelMin)
        .div(labelMax.sub(labelMin));

      return {
        inputs: normalizedInputs,
        labels: normalizedLabels,
        inputMax,
        inputMin,
        labelMax,
        labelMin,
      };
    });
  }

  async trainModel(inputs: any, labels: any) {
    this.model.compile({
      optimizer: this.getOptimizerOfInputParameter(),
      loss: tf.losses.meanSquaredError,
      metrics: ['mse'],
    });

    const batchSize = 183;
    const epochs = this.parameters.epochs;

    return await this.model.fit(inputs, labels, {
      batchSize,
      epochs,
      shuffle: true,
    });
  }

  testModel(inputData: any, normalizationData: any) {
    const { inputMax, inputMin, labelMin, labelMax } = normalizationData;

    const [xs, preds] = tf.tidy(() => {
      const xs = tf.linspace(0, 2, 100);
      const preds = this.model.predict([xs.reshape([100, 1])]);
      const unNormXs = xs.mul(inputMax.sub(inputMin)).add(inputMin);
      const unNormPreds = preds.mul(labelMax.sub(labelMin)).add(labelMin);
      return [unNormXs.dataSync(), unNormPreds.dataSync()];
    });

    const predictedPoints = Array.from(xs).map((val, i) => {
      return { x: val, y: preds[i] };
    });

    const originalPoints = inputData.map((d: any) => ({
      x: d.x,
      y: d.y,
    }));

    this.drawChart(originalPoints, predictedPoints);
  }

  drawChart(originalPoints: any, predictedPoints: any) {
    setTimeout(() => {
      this.scatterChartData = [
        {
          data: [...predictedPoints],
          label: 'Predicted Data',
          pointBackgroundColor: '#2CFFFA',
          backgroundColor: '#2CFFFA',
        },
        {
          data: [...originalPoints],
          label: 'Original Data',
          pointBackgroundColor: '#041F4E',
          backgroundColor: '#041F4E',
        }
      ];
    }, 0);
  }

  predictValue() {
    const xValue = this.predictForm.get('xValue')?.value;
    const tensor = tf.tidy(() => {
      return this.model.predict(tf.tensor1d([xValue]));
    });
    console.log(tensor.dataSync())
    this.predictedYValue = tensor.dataSync()[0];
    this.actualYValue =
      (xValue + 0.8) * (xValue - 0.2) * (xValue - 0.3) * (xValue - 0.6);
  }

  getOptimizerOfInputParameter() {
    const learningRate = this.parameters.learningRate;
    switch (this.parameters.optimizer) {
      // case Optimizer.Adadelta:
      //   return tf.train.adadelta(learningRate);
      case Optimizer.Adagrad:
        return tf.train.adagrad(learningRate);
      case Optimizer.Adam:
        return tf.train.adam();
      case Optimizer.Adamax:
        return tf.train.adamax();
      // case Optimizer.RMSProp:
      //   return tf.train.rmsprop(learningRate);
      // case Optimizer.SGD:
      //   return tf.train.sgd(learningRate);
    }
  }
}
