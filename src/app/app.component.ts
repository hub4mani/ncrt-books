import { Component, Injectable, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; 
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    PdfViewerModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
@Injectable({ providedIn: 'root' })
export class AppComponent implements OnInit {
  title = 'ncrt-books';
  grades = ['V', 'VI', 'VII']; // Populate with actual grades
  subjects: string[] = ['Maths', 'ICT'];
  lessons: string[] = [];
  selectedGrade: string = '';
  selectedSubject: string = '';
  selectedLesson: string = '';
  pdfSrc: any = null;
  chatMessages: { text: string, isUser: boolean }[] = [];
  userQuestion: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Fetch subjects and lessons based on selected grade
    this.fetchSubjectsAndLessons();
  }

  fetchSubjectsAndLessons() {
    // Implement the logic to fetch subjects and lessons based on the selected grade
    // Example:
    // this.http.get(`/api/grades/${this.selectedGrade}/subjects`).subscribe((data: any) => {
    //   this.subjects = data.subjects;
    //   this.lessons = data.lessons;
    // });
  }

  loadLesson() {
    // Fetch PDF URL based on selected lesson
    this.pdfSrc = '...'; // Set PDF source URL

    this.http.post('/start_chat', { lesson: this.selectedLesson }).subscribe((response) => {
      // Handle start_chat response if needed
    });
  }

  askQuestion() {
    this.chatMessages.push({ text: this.userQuestion, isUser: true });
    const question = this.userQuestion;
    this.userQuestion = '';

    this.http.post('/chat', { question }).subscribe((response: any) => {
      this.chatMessages.push({ text: response.answer, isUser: false });
    });
  }

  endChat() {
    this.http.post('/end_chat', {}).subscribe((response) => {
      // Handle end_chat response if needed
      this.chatMessages = [];
    });
  }
}
