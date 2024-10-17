import { Component, HostListener, Injectable, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; 
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input'; 
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';
// Import AppPdfViewerComponent here, but don't add it to imports array
import { AppPdfViewerComponent } from './app-pdf-viewer/app-pdf-viewer.component'; 
import { MarkdownModule } from 'ngx-markdown';
import { GoogleSigninButtonModule } from '@abacritt/angularx-social-login'
import { SocialAuthService, SocialUser } from "@abacritt/angularx-social-login";
import { GoogleLoginProvider } from "@abacritt/angularx-social-login";


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
    MatInputModule,
    PdfViewerModule, 
    MarkdownModule,
    AppPdfViewerComponent,
    GoogleSigninButtonModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
@Injectable({ providedIn: 'root' })
export class AppComponent implements OnInit {
  title = 'Lesson Q&A';
  grades: Grade[] = [];
  subjects: Subject[] = [];
  lessons: Lesson[] = [];

  selectedGrade: Grade | null = null;
  selectedSubject: Subject | null = null;
  selectedLesson: Lesson | null = null;
  
  pdfSrc: any = null;
  chatMessages: { text: string, isUser: boolean }[] = [];
  userQuestion: string = '';
  chatId: string | null = null; // To store the chat ID
  chatStarted: boolean = false;
  updateSuccess: boolean = false;

  user: SocialUser | null = null; 
  loggedIn: boolean = false;
  

  constructor(private http: HttpClient, private authService: SocialAuthService) {}

  ngOnInit() {
    this.fetchGrades();
    this.authService.authState.subscribe((user) => {
      this.user = user;
      this.loggedIn = (user != null);
      if (user) {
        this.logUserActivity('login'); // Log login activity
      }
    });
  }

  signInWithGoogle(): void {
    this.authService.signIn(GoogleLoginProvider.PROVIDER_ID);
  }

  signOut(): void {
    this.logUserActivity('logout');
    this.authService.signOut();
  }

  private logUserActivity(activityType: string): void {
    if (this.user) { // Ensure user is logged in
      const activityData = {
        username: this.user.firstName + ' ' + this.user.lastName,
        email: this.user.email,
        activity_type: activityType
      };

      this.http.post(
        'https://ai-gateway-serv-178678790881.asia-south1.run.app/lesson-data/user_activity', 
        activityData
      ).subscribe(
        response => {
          console.log('User activity logged successfully:', response);
        },
        error => {
          console.error('Error logging user activity:', error);
        }
      );
    }
  }

  fetchGrades() {
    this.http.get<Grade[]>(
      `https://ai-gateway-serv-178678790881.asia-south1.run.app/lesson-data/grades`
    )
      .subscribe(data => {
        this.grades = data; 
      });
  }

  fetchSubjects(gradeId: number | undefined) {
    if (gradeId !== undefined) { 
      this.http.get<Subject[]>(
        `https://ai-gateway-serv-178678790881.asia-south1.run.app/lesson-data/subjects?grade_id=${gradeId.toString()}`
      ) 
        .subscribe(data => {
          this.subjects = data; 
        });
    } else {
      this.subjects = [];
    }
  }

  fetchLessons(subjectId: number | undefined) {
    if (subjectId !== undefined) {
      this.http.get<Lesson[]>(
        `https://ai-gateway-serv-178678790881.asia-south1.run.app/lesson-data/lessons?subject_id=${subjectId.toString()}`
      ) 
        .subscribe(data => {
          this.lessons = data;
        });
    } else {
      this.lessons = []; 
    }
  }

  loadLesson() {
    if (this.selectedLesson) {
      const pdfUrl = this.selectedLesson.github_url;
      this.pdfSrc = pdfUrl.replace('https://raw.githubusercontent.com/hub4mani/ncrt-books/main/', '');

      console.log('PDF Src=' + this.pdfSrc);

      // Start the chat session
      this.http.post(
        'https://ai-gateway-serv-178678790881.asia-south1.run.app/doc-ai/start_chat',
        { pdf_url: this.selectedLesson.github_url }
      )
        .subscribe({
          next: (response: any) => {
            this.chatId = response.chat_id; 
            console.log('Chat session started:', this.chatId);
            this.chatStarted = true;
          },
          error: (error) => {
            console.error('Error starting chat:', error); 
          }
        });
    }
  }

  askQuestion() {
    if (this.chatId && this.userQuestion) { // Check if chatId is available
      this.chatMessages.push({ text: this.userQuestion, isUser: true });
      const question = this.userQuestion;
      this.userQuestion = '';

      // Send the chat query
      this.http.post(
          'https://ai-gateway-serv-178678790881.asia-south1.run.app/doc-ai/chat',
          { 
            chat_id: this.chatId,
            query: question,
          }
        )
        .subscribe((response: any) => {
          this.chatMessages.push({ text: response.answer, isUser: false });
        });
    } else {
      console.error('Chat session not started.'); 
    }
  }

  endChat() {
    if (this.chatId) { // Check if chatId is available
      this.http.post(
        'https://ai-gateway-serv-178678790881.asia-south1.run.app/doc-ai/end_chat',
        { 
          chat_id: this.chatId,
          query: '',
        }
      )
        .subscribe((response) => {
          this.chatMessages = [];
          this.chatId = null; // Reset chatId
          this.chatStarted = false;
        });
    }
  }

  @HostListener('document:keydown.enter', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.chatStarted) {
      this.askQuestion();
    }
  }

  lessonNumberStartsWithAlphabet(lessonNumber: string | undefined): boolean {
    if (lessonNumber === undefined) {
      return false; 
    }
    return /^[a-zA-Z]/.test(lessonNumber);
  }

  updateLessonTitle() {
    if (this.selectedLesson) { // Ensure a lesson is selected
      const lessonId = this.selectedLesson.id; 
      const url = `https://ai-gateway-serv-178678790881.asia-south1.run.app/lesson-data/lessons/${lessonId}`;

      this.http.put(url, {
        lesson_number: this.selectedLesson.lesson_number, // Use the updated values
        name: this.selectedLesson.name                  // Use the updated values
      }, {
        headers: { 'Content-Type': 'application/json' }
      })
        .subscribe(
          response => {
            console.log('Lesson title updated successfully:', response);
            this.updateSuccess = true;
          },
          error => {
            console.error('Error updating lesson title:', error);
            this.updateSuccess = false;
          }
        );
    }
  }
}
