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
import { AppPdfViewerComponent } from './app-pdf-viewer/app-pdf-viewer.component';

interface Grade {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  grade_id: number;
}

interface Lesson {
  id: number;
  name: string;
  subject_id: number;
  github_url: string;
  lesson_number: string;
  lesson_title: string;
}

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
    AppPdfViewerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
@Injectable({ providedIn: 'root' })
export class AppComponent implements OnInit {
  title = 'ncrt-books';
  grades: Grade[] = [];
  subjects: Subject[] = [];
  lessons: Lesson[] = [];

  selectedGrade: Grade | null = null; // Initialize as null
  selectedSubject: Subject | null = null; // Initialize as null
  selectedLesson: Lesson | null = null;
  
  pdfSrc: any = null;
  chatMessages: { text: string, isUser: boolean }[] = [];
  userQuestion: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchGrades();
  }

  fetchGrades() {
    this.http.get<Grade[]>(`https://ai-gateway-serv.purpledune-797b0a60.eastus.azurecontainerapps.io/lesson-data/grades`)
      .subscribe(data => {
        this.grades = data; 
      });
  }

  fetchSubjects(gradeId: number | undefined) {
    if (gradeId !== undefined) { 
      this.http.get<Subject[]>(`https://ai-gateway-serv.purpledune-797b0a60.eastus.azurecontainerapps.io/lesson-data/subjects?grade_id=${gradeId.toString()}`) 
        .subscribe(data => {
          this.subjects = data; 
        });
    } else {
      this.subjects = []; // Clear subjects if no grade is selected
    }
  }

  fetchLessons(subjectId: number | undefined) {
    if (subjectId !== undefined) {
      this.http.get<Lesson[]>(`https://ai-gateway-serv.purpledune-797b0a60.eastus.azurecontainerapps.io/lesson-data/lessons?subject_id=${subjectId.toString()}`) 
        .subscribe(data => {
          this.lessons = data;
        });
    } else {
      this.lessons = []; // Clear lessons if no subject is selected
    }
  }

  loadLesson() {
    if (this.selectedLesson) {
      const pdfUrl = this.selectedLesson.github_url; // .replace('/blob/', '/raw/'); 
      // Remove the base URL from the full URL
      this.pdfSrc = pdfUrl.replace('https://raw.githubusercontent.com/hub4mani/ncrt-books/main/', '');

      console.log("PDF Src=" + this.pdfSrc);

      // this.http.post('https://ai-gateway-serv.purpledune-797b0a60.eastus.azurecontainerapps.io/doc-ai/start_chat', { lesson: this.selectedLesson }).subscribe({
      //   next: (response) => {
      //     // Handle start_chat response
      //   },
      //   error: (error) => {
      //     console.error('Error starting chat:', error); 
      //     // Display error message to the user
      //   }
      // });
    }
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
