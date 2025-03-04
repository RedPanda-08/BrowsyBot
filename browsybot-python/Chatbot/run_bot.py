from browsing_bot import BrowsingHistoryBot

def main():
    # Create a new bot instance
    bot = BrowsingHistoryBot()
    
    print("Welcome to Browsing History Bot!")
    print("\nAvailable commands for your easiness:")
    print("- save url|title|notes|tags")
    print("- search query")
    print("- tag tagname")
    print("- exit (to quit)")
    
    while True:
        # Get user input
        user_input = input("\nEnter command: ").strip()
        
        # Check for exit command
        if user_input.lower() == 'exit':
            bot.close()
            print("Goodbye!")
            break
        
        # Process the command and print response
        response = bot.chat(user_input)
        print("\nResponse:", response)

if __name__ == "__main__":
    main()