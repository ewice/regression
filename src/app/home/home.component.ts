import {Component, OnInit} from '@angular/core';
import {faArrowDown} from '@fortawesome/free-solid-svg-icons';
import {ParameterInterface} from '../../shared/interfaces/parameter.interface';
import {ActivationIdentifier} from '../../shared/enums/activation-identifier.enum';
import {Optimizer} from '../../shared/enums/optimizer.enum';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass'],
})
export class HomeComponent implements OnInit {
  faArrowDown = faArrowDown;
  parameters: ParameterInterface | undefined;
  isTraining = false;

  activationIdentifier(): Array<string> {
    return Object.keys(ActivationIdentifier);
  }

  optimizers(): Array<string> {
    return Object.keys(Optimizer);
  }

  parameterForm = new FormGroup({
    fitting: new FormControl('normal-fitting', Validators.required),
    hidden: new FormControl(10, Validators.required),
    neuron: new FormControl(50, Validators.required),
    activation: new FormControl(
      this.activationIdentifier()[3],
      Validators.required
    ),
    learningRate: new FormControl(1, Validators.required),
    optimizer: new FormControl(this.optimizers()[1], Validators.required),
    epochs: new FormControl(50, Validators.required),
  });

  constructor() {
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    this.parameters = {
      fitting: this.parameterForm.get('fitting')?.value,
      hidden: this.parameterForm.get('hidden')?.value,
      neuron: this.parameterForm.get('neuron')?.value,
      weight: this.parameterForm.get('weight')?.value,
      activation: this.parameterForm.get('activation')?.value,
      learningRate: this.parameterForm.get('learningRate')?.value,
      optimizer: this.parameterForm.get('optimizer')?.value,
      epochs: this.parameterForm.get('epochs')?.value,
    };
  }

  setLoadingSpinner($event: boolean) {
    setTimeout(() => {
      this.isTraining = $event;
      if (!this.isTraining) {
        const element = document.getElementById('model');
        // @ts-ignore
        element.scrollIntoView({behavior: 'smooth'});
      }
    }, 0)
  }
}
